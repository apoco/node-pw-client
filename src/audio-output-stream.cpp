#include <cmath>
#include <format>
#include <iostream>
#include <napi.h>
#include <numbers>
#include <pipewire/pipewire.h>
#include <spa/param/audio/format-utils.h>
#include <spa/param/latency-utils.h>
#include <spa/param/props.h>
#include <spa/pod/builder.h>
#include <spa/utils/result.h>
#include <vector>

#include "audio-output-stream.hpp"
#include "promises.hpp"

#define DEFAULT_RATE 48000
#define DEFAULT_CHANNELS 2
#define DEFAULT_BUFFER_SIZE 2048
#define DEFAULT_FORMAT SPA_AUDIO_FORMAT_F64
#define DEFAULT_BYTE_DEPTH 8

using namespace std;
using namespace std::numbers;

Napi::FunctionReference AudioOutputStream::constructor;
pw_properties* getStreamProps(const Napi::Object& options);
void onStateChange(void* userData, pw_stream_state old, pw_stream_state state, const char* error);
void onParamChange(void* userData, uint32_t id, const struct spa_pod* param);
void onProcess(void* userData);
Napi::Object parseProps(const Napi::Env env, const struct spa_pod_object* props);
Napi::Value podToJsValue(const Napi::Env env, const struct spa_pod* pod);

static const pw_stream_events stream_events = {
    .version = PW_VERSION_STREAM_EVENTS,
    .destroy = NULL,
    .state_changed = onStateChange,
    .control_info = NULL,
    .io_changed = NULL,
    .param_changed = onParamChange,
    .add_buffer = NULL,
    .remove_buffer = NULL,
    .process = onProcess,
};

Napi::Function AudioOutputStream::init(Napi::Env env)
{
    auto ctor = DefineClass(
        env,
        "PipeWireStream",
        {
            InstanceMethod<&AudioOutputStream::connect>(
                "connect",
                napi_enumerable),
            InstanceAccessor(
                "bufferSize",
                &AudioOutputStream::getBufferSize,
                NULL,
                napi_enumerable),
            InstanceMethod<&AudioOutputStream::write>(
                "write",
                napi_enumerable),
            InstanceMethod<&AudioOutputStream::isReady>(
                "isReady",
                napi_enumerable),
            InstanceMethod<&AudioOutputStream::isFinished>(
                "isFinished",
                napi_enumerable),
            InstanceMethod<&AudioOutputStream::destroy>(
                "destroy",
                napi_enumerable),
        });

    constructor = Napi::Persistent(ctor);
    constructor.SuppressDestruct();

    return ctor;
}

AudioOutputStream::AudioOutputStream(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<AudioOutputStream>(info)
    , session(NULL)
    , stream(NULL)
    , format(DEFAULT_FORMAT)
    , bytesPerSample(DEFAULT_BYTE_DEPTH)
    , rate(DEFAULT_RATE)
    , channels(DEFAULT_CHANNELS)
    , frameBufferSize(2048)
    , queuedFrameCount(0)
    , currentBufferOffset(0)
    , stateChangedCallback(NULL)
    , paramChangedCallback(NULL)
    , latencyCallback(NULL)
    , propsCallback(NULL)
    , readyDeferral(NULL)
    , finishedDeferral(NULL)
{
    Napi::Env env = info.Env();
    if (!info.IsConstructCall()) {
        Napi::Error::New(env, "Must be called as a constructor").ThrowAsJavaScriptException();
    }
}

Napi::Promise AudioOutputStream::create(PipeWireSession* session, const Napi::Object& options)
{
    this->session = session;
    auto env = options.Env();

    format = (spa_audio_format)options.Get("format").As<Napi::Number>().Uint32Value();
    bytesPerSample = options.Get("bytesPerSample").As<Napi::Number>().Uint32Value();
    rate = options.Get("rate").As<Napi::Number>().Uint32Value();
    channels = options.Get("channels").As<Napi::Number>().Uint32Value();

    auto name = options.Get("name").As<Napi::String>().Utf8Value();
    auto properties = getStreamProps(options);

    props = Napi::ObjectReference::New(Napi::Object::New(env), 1);

    initCallbacks(options);

    Ref();
    return async(
        env,
        [this, name, properties]() {
            initStream(name, properties);
        },
        [this]() {
            Unref();
            return Value();
        });
}

void AudioOutputStream::initCallbacks(const Napi::Object& options)
{
    auto env = options.Env();

    stateChangedCallback = Napi::ThreadSafeFunction::New(
        env,
        options.Get("onStateChange").As<Napi::Function>(),
        "PipeWireStream::stateChangedCallback", 0, 1);

    propsCallback = Napi::ThreadSafeFunction::New(
        env,
        options.Get("onPropsChange").As<Napi::Function>(),
        "PipeWireStream::propsCallback", 0, 1);

    formatChangeCallback = Napi::ThreadSafeFunction::New(
        env,
        options.Get("onFormatChange").As<Napi::Function>(),
        "PipeWireStream::formatChangeCallback", 0, 1);

    latencyCallback = Napi::ThreadSafeFunction::New(
        env,
        options.Get("onLatencyChange").As<Napi::Function>(),
        "PipeWireStream::latencyCallback", 0, 1);

    paramChangedCallback = Napi::ThreadSafeFunction::New(
        env,
        options.Get("onUnknownParamChange").As<Napi::Function>(),
        "PipeWireStream::paramChangedCallback", 0, 1);
}

void AudioOutputStream::initStream(std::string name, pw_properties* properties)
{
    session->withThreadLock([this, name, properties]() {
        stream = pw_stream_new_simple(
            session->getLoop(),
            name.c_str(),
            properties,
            &stream_events,
            this);
    });
}

std::vector<spa_audio_format> AudioOutputStream::parsePreferredFormats(const Napi::Object& options)
{
    if (!options.Has("preferredFormats") || !options.Get("preferredFormats").IsArray()) {
        throw std::runtime_error("connect() requires preferredFormats array");
    }

    std::vector<spa_audio_format> preferredFormats;
    auto formatsArray = options.Get("preferredFormats").As<Napi::Array>();
    for (uint32_t i = 0; i < formatsArray.Length(); i++) {
        auto formatValue = formatsArray.Get(i).As<Napi::Number>().Uint32Value();
        preferredFormats.push_back((spa_audio_format)formatValue);
    }
    return preferredFormats;
}

void AudioOutputStream::buildFormatParams(struct spa_pod_builder& podBuilder,
    const std::vector<spa_audio_format>& preferredFormats,
    const std::vector<uint32_t>& preferredRates)
{
    struct spa_pod_frame formatFrame;
    spa_pod_builder_push_object(&podBuilder, &formatFrame, SPA_TYPE_OBJECT_Format, SPA_PARAM_EnumFormat);
    spa_pod_builder_add(&podBuilder, SPA_FORMAT_mediaType, SPA_POD_Id(SPA_MEDIA_TYPE_audio), 0);
    spa_pod_builder_add(&podBuilder, SPA_FORMAT_mediaSubtype, SPA_POD_Id(SPA_MEDIA_SUBTYPE_raw), 0);

    // Add format choices - always offer multiple formats for best compatibility
    if (preferredFormats.size() == 1) {
        spa_pod_builder_add(&podBuilder, SPA_FORMAT_AUDIO_format, SPA_POD_Id(preferredFormats[0]), 0);
    } else {
        struct spa_pod_frame choiceFrame;
        spa_pod_builder_prop(&podBuilder, SPA_FORMAT_AUDIO_format, 0);
        spa_pod_builder_push_choice(&podBuilder, &choiceFrame, SPA_CHOICE_Enum, 0);
        spa_pod_builder_id(&podBuilder, preferredFormats[0]); // Default/preferred
        for (auto fmt : preferredFormats) {
            spa_pod_builder_id(&podBuilder, fmt);
        }
        spa_pod_builder_pop(&podBuilder, &choiceFrame);
    }

    // Add rate choices - negotiate sample rate based on preferences
    if (preferredRates.size() == 1) {
        spa_pod_builder_add(&podBuilder, SPA_FORMAT_AUDIO_rate, SPA_POD_Int(preferredRates[0]), 0);
    } else {
        struct spa_pod_frame choiceFrame;
        spa_pod_builder_prop(&podBuilder, SPA_FORMAT_AUDIO_rate, 0);
        spa_pod_builder_push_choice(&podBuilder, &choiceFrame, SPA_CHOICE_Enum, 0);
        spa_pod_builder_int(&podBuilder, preferredRates[0]); // Default/preferred
        for (auto rate : preferredRates) {
            spa_pod_builder_int(&podBuilder, rate);
        }
        spa_pod_builder_pop(&podBuilder, &choiceFrame);
    }

    spa_pod_builder_add(&podBuilder, SPA_FORMAT_AUDIO_channels, SPA_POD_Int(this->channels), 0);
    spa_pod_builder_pop(&podBuilder, &formatFrame);
}

void AudioOutputStream::connectStream(const std::vector<spa_audio_format>& preferredFormats,
    const std::vector<uint32_t>& preferredRates)
{
    session->withThreadLock([this, preferredFormats, preferredRates]() {
        uint8_t buffer[4096]; // Larger buffer for multiple formats
        struct spa_pod_builder podBuilder = SPA_POD_BUILDER_INIT(buffer, sizeof(buffer));

        buildFormatParams(podBuilder, preferredFormats, preferredRates);

        const struct spa_pod* connectParams[1] = {
            (struct spa_pod*)buffer
        };

        pw_stream_connect(
            stream,
            PW_DIRECTION_OUTPUT,
            PW_ID_ANY,
            (pw_stream_flags)(PW_STREAM_FLAG_AUTOCONNECT | PW_STREAM_FLAG_MAP_BUFFERS | PW_STREAM_FLAG_RT_PROCESS),
            connectParams,
            1);
    });
}

Napi::Value AudioOutputStream::connect(const Napi::CallbackInfo& info)
{
    auto env = info.Env();

    if (info.Length() == 0 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "connect() requires options object with preferredFormats").ThrowAsJavaScriptException();
    }

    auto options = info[0].As<Napi::Object>();

    try {
        auto preferredFormats = parsePreferredFormats(options);
        auto preferredRates = parsePreferredRates(options);

        return async(
            env,
            [this, preferredFormats, preferredRates]() {
                connectStream(preferredFormats, preferredRates);
            },
            [env]() {
                return env.Undefined();
            });
    } catch (const std::exception& e) {
        Napi::TypeError::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

pw_stream* AudioOutputStream::getStream()
{
    return stream;
}

uint32_t AudioOutputStream::getRate()
{
    return rate;
}

uint32_t AudioOutputStream::getChannels()
{
    return channels;
}

uint32_t AudioOutputStream::getBytesPerFrame()
{
    return bytesPerSample * channels;
}

Napi::Value AudioOutputStream::getBufferSize(const Napi::CallbackInfo& info)
{
    // Return available buffer space in bytes, not frames
    auto availableFrames = (long)frameBufferSize - queuedFrameCount;
    auto availableBytes = availableFrames * getBytesPerFrame();
    return Napi::Number::New(info.Env(), std::max((long)0, availableBytes));
}

void AudioOutputStream::onStateChange(pw_stream_state state, const char* error)
{
    std::string errorMessage = error ? error : "";
    stateChangedCallback.NonBlockingCall(
        [state, errorMessage](const Napi::Env env, Napi::Function jsCallback) {
            auto jsState = Napi::Number::New(env, (int)state);
            auto jsError = Napi::String::New(env, errorMessage);
            jsCallback.Call({ jsState, jsError });
        });
}

void AudioOutputStream::onPropsChange(const spa_pod* param)
{
    // Copy the props to a new object since we're using the data in another thread
    auto copy = spa_pod_copy(param);
    auto properties = (struct spa_pod_object*)copy;

    propsCallback.NonBlockingCall([this, properties](const Napi::Env env, Napi::Function jsCallback) {
        setProps(env, properties);
        jsCallback.Call({ props.Value() });
    });
}

void AudioOutputStream::setProp(const char* key, spa_pod* value)
{
    props.Value()[key] = podToJsValue(props.Env(), value);
}

void AudioOutputStream::setChannelProp(uint32_t index, const char* key, Napi::Value value)
{
    auto env = props.Env();
    auto propsObj = props.Value();

    Napi::Array channels;
    if (propsObj.Has("channels")) {
        channels = props.Get("channels").As<Napi::Array>();
    } else {
        channels = Napi::Array::New(env);
        propsObj.Set("channels", channels);
    }

    Napi::Object channel;
    if (index >= channels.Length()) {
        channel = Napi::Object::New(env);
        channels.Set(index, channel);
    } else {
        channel = channels.Get(index).As<Napi::Object>();
    }

    channel[key] = value;
}

Napi::Value podToJsValue(const Napi::Env env, const struct spa_pod* pod)
{
    if (spa_pod_is_int(pod)) {
        int32_t value;
        spa_pod_get_int(pod, &value);
        return Napi::Number::New(env, value);
    } else if (spa_pod_is_float(pod)) {
        float value;
        spa_pod_get_float(pod, &value);
        return Napi::Number::New(env, value);
    } else if (spa_pod_is_bool(pod)) {
        bool value;
        spa_pod_get_bool(pod, &value);
        return Napi::Boolean::New(env, value);
    } else if (spa_pod_is_string(pod)) {
        const char* str;
        spa_pod_get_string(pod, &str);
        return Napi::String::New(env, str);
    } else {
        // Handle other types as needed
        printf("Unhandled POD type %d\n", pod->type);
        return env.Undefined();
    }
}

void AudioOutputStream::setProps(Napi::Env env, const spa_pod_object* properties)
{
    struct spa_pod_prop* prop;
    SPA_POD_OBJECT_FOREACH(properties, prop)
    {
        auto key = (spa_prop)prop->key;
        auto value = &prop->value;
        switch (key) {
        case SPA_PROP_volume:
            setProp("volume", value);
            break;
        case SPA_PROP_mute:
            setProp("mute", value);
            break;
        case SPA_PROP_monitorMute:
            setProp("monitorMute", value);
            break;
        case SPA_PROP_softMute:
            setProp("softMute", value);
            break;
        case SPA_PROP_channelVolumes: {
            uint32_t numVolumes;
            auto volumes = (float*)spa_pod_get_array(&prop->value, &numVolumes);
            for (uint32_t i = 0; i < numVolumes; i++) {
                setChannelProp(i, "volume", Napi::Number::New(env, volumes[i]));
            }
        } break;
        case SPA_PROP_channelMap: {
            uint32_t numChannels;
            auto channelIds = (spa_audio_channel*)spa_pod_get_array(&prop->value, &numChannels);
            for (uint32_t i = 0; i < numChannels; i++) {
                setChannelProp(i, "id", Napi::Number::New(env, channelIds[i]));
            }
        } break;
        case SPA_PROP_monitorVolumes: {
            uint32_t numMonitorVolumes;
            auto monitorVolumes = (float*)spa_pod_get_array(&prop->value, &numMonitorVolumes);
            for (uint32_t i = 0; i < numMonitorVolumes; i++) {
                setChannelProp(i, "monitorVolume", Napi::Number::New(env, monitorVolumes[i]));
            }
        } break;
        case SPA_PROP_softVolumes: {
            uint32_t numVolumes;
            auto volumes = (float*)spa_pod_get_array(&prop->value, &numVolumes);
            for (uint32_t i = 0; i < numVolumes; i++) {
                setChannelProp(i, "softVolume", Napi::Number::New(env, volumes[i]));
            }
        } break;
        case SPA_PROP_params: {
            auto paramsObj = Napi::Object::New(env);
            spa_pod_parser parser;
            spa_pod_frame frame;
            spa_pod_parser_pod(&parser, &prop->value);
            spa_pod_parser_push_struct(&parser, &frame);
            while (true) {
                const char* name;
                if (spa_pod_parser_get_string(&parser, &name) < 0) {
                    break;
                }

                spa_pod* param;
                if (spa_pod_parser_get_pod(&parser, &param) < 0) {
                    break;
                }

                paramsObj[name] = podToJsValue(env, param);
            }
            props.Set("params", paramsObj);
        } break;
        default:
            printf("Unhandled prop %d\n", key);
            break;
        }
    }
}

void AudioOutputStream::onFormatChange(const spa_pod* param)
{
    spa_audio_info_raw audioInfo;
    spa_format_audio_raw_parse(param, &audioInfo);

    auto newRate = audioInfo.rate;
    auto newChannels = audioInfo.channels;
    auto newFormat = audioInfo.format;

    // Calculate bytes per sample for the new format
    uint32_t newBytesPerSample;
    switch (newFormat) {
    case SPA_AUDIO_FORMAT_F64:
        newBytesPerSample = 8;
        break;
    case SPA_AUDIO_FORMAT_F32:
        newBytesPerSample = 4;
        break;
    case SPA_AUDIO_FORMAT_S32:
    case SPA_AUDIO_FORMAT_U32:
    case SPA_AUDIO_FORMAT_S24_32:
        newBytesPerSample = 4;
        break;
    case SPA_AUDIO_FORMAT_S16:
    case SPA_AUDIO_FORMAT_U16:
        newBytesPerSample = 2;
        break;
    default:
        // Default to 4 bytes for unknown formats
        newBytesPerSample = 4;
        break;
    }

    if (newRate != rate || newChannels != channels || newFormat != format || newBytesPerSample != bytesPerSample) {
        rate = newRate;
        channels = newChannels;
        format = newFormat;
        bytesPerSample = newBytesPerSample;

        formatChangeCallback.NonBlockingCall([this](const Napi::Env env, Napi::Function jsCallback) {
            auto formatObj = Napi::Object::New(env);
            formatObj.Set("rate", Napi::Number::New(env, rate));
            formatObj.Set("channels", Napi::Number::New(env, channels));
            formatObj.Set("format", Napi::Number::New(env, format));
            jsCallback.Call({ formatObj });
        });
    }
}

void AudioOutputStream::onLatencyChange(const spa_pod* param)
{
    spa_latency_info latency;
    spa_latency_parse(param, &latency);
    latencyCallback.NonBlockingCall([latency](const Napi::Env env, Napi::Function jsCallback) {
        auto minimums = Napi::Object::New(env);
        minimums.Set("nanoseconds", Napi::BigInt::New(env, latency.min_ns));
        minimums.Set("quantum", Napi::Number::New(env, latency.min_quantum));
        minimums.Set("rate", Napi::Number::New(env, latency.min_rate));

        auto maximums = Napi::Object::New(env);
        maximums.Set("nanoseconds", Napi::BigInt::New(env, latency.max_ns));
        maximums.Set("quantum", Napi::Number::New(env, latency.max_quantum));
        maximums.Set("rate", Napi::Number::New(env, latency.max_rate));

        auto latencyObj = Napi::Object::New(env);
        latencyObj.Set("direction", latency.direction == SPA_DIRECTION_INPUT ? "input" : "output");
        latencyObj.Set("min", minimums);
        latencyObj.Set("max", maximums);

        jsCallback.Call({ latencyObj });
    });
}

void AudioOutputStream::onUnknownParamChange(uint32_t param)
{
    paramChangedCallback.NonBlockingCall([param](const Napi::Env env, Napi::Function jsCallback) {
        jsCallback.Call({ Napi::Number::New(env, param) });
    });
}

Napi::Value AudioOutputStream::write(const Napi::CallbackInfo& info)
{
    auto env = info.Env();
    if (!info[0].IsArrayBuffer()) {
        Napi::TypeError::New(env, "First argument must be an ArrayBuffer").ThrowAsJavaScriptException();
    }

    auto buffer = info[0].As<Napi::ArrayBuffer>();
    auto size = buffer.ByteLength();

    auto frameSize = getBytesPerFrame();
    if (size % frameSize != 0) {
        Napi::TypeError::New(
            env,
            std::format(
                "Buffer size {} must align to frame size {} ({} x {})",
                size,
                frameSize,
                bytesPerSample,
                channels))
            .ThrowAsJavaScriptException();
    }

    js_buffer newBuffer = {
        .buffer = (uint8_t*)buffer.Data(),
        .size = size,
    };

    this->bufferRefs.push(Napi::Persistent(buffer));
    this->buffers.push(newBuffer);
    this->queuedFrameCount += size / frameSize;

    return env.Undefined();
}

Napi::Value AudioOutputStream::isReady(const Napi::CallbackInfo& info)
{
    auto env = info.Env();
    auto availableFrames = (long)frameBufferSize - queuedFrameCount;
    auto availableBytes = availableFrames * getBytesPerFrame();
    if (availableBytes > 0) {
        return resolved(Napi::Number::New(env, availableBytes));
    }

    if (!readyDeferral) {
        readyDeferral = new Napi::Promise::Deferred(env);
        readySignal = Napi::ThreadSafeFunction::New(
            env,
            Napi::Function::New(env, [this](const Napi::CallbackInfo& info) {
                auto env = info.Env();
                auto availableFrames = (long)frameBufferSize - queuedFrameCount;
                auto availableBytes = availableFrames * getBytesPerFrame();
                if (availableBytes > 0) {
                    readyDeferral->Resolve(Napi::Number::New(env, availableBytes));
                    readyDeferral = NULL;
                }
            }),
            "PipeWireStream::readySignal", 0, 1, readyDeferral);
    }

    return readyDeferral->Promise();
}

Napi::Value AudioOutputStream::isFinished(const Napi::CallbackInfo& info)
{
    auto env = info.Env();
    if (this->queuedFrameCount == 0) {
        return resolved(env.Undefined());
    }

    if (!this->finishedDeferral) {
        this->finishedDeferral = new Napi::Promise::Deferred(env);
        this->finishedSignal = Napi::ThreadSafeFunction::New(
            env,
            Napi::Function::New(env, [this](const Napi::CallbackInfo& info) {
                auto env = info.Env();
                this->finishedDeferral->Resolve(env.Undefined());
                this->finishedDeferral = NULL;
            }),
            "PipeWireStream::finishedSignal", 0, 1, this->finishedDeferral);
    }

    return this->finishedDeferral->Promise();
}

void AudioOutputStream::fillBuffer(uint8_t* destBuffer, uint size)
{
    auto remainingBytes = size;
    uint destOffset = 0;
    uint totalWritten = 0;
    auto stride = getBytesPerFrame();
    while (remainingBytes > 0 && buffers.size()) {
        auto sourceJsBuffer = buffers.front();
        auto sourceTotalBytes = sourceJsBuffer.size;
        auto sourceRemaining = sourceTotalBytes - currentBufferOffset;
        auto amtToCopy = remainingBytes > sourceRemaining ? sourceRemaining : remainingBytes;
        memcpy(
            destBuffer + destOffset,
            sourceJsBuffer.buffer + currentBufferOffset,
            amtToCopy);
        totalWritten += amtToCopy;
        remainingBytes -= amtToCopy;
        currentBufferOffset += amtToCopy;
        destOffset += amtToCopy;
        queuedFrameCount -= amtToCopy / stride;
        if (currentBufferOffset >= sourceTotalBytes) {
            buffers.pop();
            bufferRefs.pop();
            currentBufferOffset = 0;
        }
    }

    // We ran out of source data; zero-fill the rest
    if (remainingBytes) {
        memset(destBuffer + destOffset, 0, remainingBytes);
    }

    if (queuedFrameCount < frameBufferSize && readyDeferral) {
        this->readySignal.NonBlockingCall();
        this->readySignal.Release();
    }

    if (!totalWritten && finishedDeferral) {
        this->finishedSignal.NonBlockingCall();
        this->finishedSignal.Release();
    }
}

Napi::Value AudioOutputStream::destroy(const Napi::CallbackInfo& info)
{
    auto env = info.Env();

    if (this->readyDeferral) {
        this->readyDeferral->Reject(Napi::Error::New(env, "Stream destroyed").Value());
        this->readyDeferral = NULL;
    }

    if (this->finishedDeferral) {
        this->finishedDeferral->Reject(Napi::Error::New(env, "Stream destroyed").Value());
        this->finishedDeferral = NULL;
    }

    return async(
        env,
        [this]() { _destroy(); },
        [this, env]() {
            stateChangedCallback.Release();
            paramChangedCallback.Release();
            propsCallback.Release();
            latencyCallback.Release();
            formatChangeCallback.Release();
            props.Unref();
            return env.Undefined();
        });
}

void AudioOutputStream::_destroy()
{
    session->withThreadLock([this]() {
        if (stream) {
            pw_stream_destroy(stream);
            stream = NULL;
        }
    });
}

AudioOutputStream::~AudioOutputStream()
{
    _destroy();
}

pw_properties* getStreamProps(const Napi::Object& options)
{
    auto streamProps = pw_properties_new(NULL);
    auto propsProp = options.Get("props");
    if (propsProp.IsObject()) {
        for (const auto& pair : propsProp.As<Napi::Object>()) {
            if (!pair.first.IsString()) {
                Napi::TypeError::New(options.Env(), "opts.props keys must be strings").ThrowAsJavaScriptException();
            }
            auto value = static_cast<Napi::Value>(pair.second);
            if (!value.IsString()) {
                Napi::TypeError::New(options.Env(), "opts.props values must be strings").ThrowAsJavaScriptException();
            }
            pw_properties_set(
                streamProps,
                pair.first.As<Napi::String>().Utf8Value().c_str(),
                value.As<Napi::String>().Utf8Value().c_str());
        }
    }
    return streamProps;
}

void onStateChange(void* userData, pw_stream_state old, pw_stream_state state, const char* error)
{
    auto stream = (AudioOutputStream*)userData;
    stream->onStateChange(state, error);
}

void onParamChange(void* userData, uint32_t id, const struct spa_pod* param)
{
    if (!param) {
        return;
    }

    auto stream = (AudioOutputStream*)userData;

    switch (id) {
    case SPA_PARAM_Props:
        return stream->onPropsChange(param);
    case SPA_PARAM_Format:
        return stream->onFormatChange(param);
    case SPA_PARAM_Latency:
        return stream->onLatencyChange(param);
    default:
        stream->onUnknownParamChange(id);
    }
}

void onProcess(void* userData)
{
    auto stream = (AudioOutputStream*)userData;
    auto pwStream = stream->getStream();

    auto pwBuffer = pw_stream_dequeue_buffer(pwStream);
    if (!pwBuffer) {
        pw_log_warn("out of buffers: %m");
        return;
    }

    auto spaData = pwBuffer->buffer->datas[0];
    auto memoryPtr = (double*)spaData.data;
    if (!memoryPtr) {
        return;
    }

    auto stride = stream->getBytesPerFrame();
    auto numFrames = spaData.maxsize / stride;
    if (pwBuffer->requested < numFrames) {
        numFrames = pwBuffer->requested;
    }
    auto byteCount = numFrames * stride;

    stream->fillBuffer((uint8_t*)spaData.data, byteCount);

    spaData.chunk->offset = 0;
    spaData.chunk->stride = stride;
    spaData.chunk->size = byteCount;

    pw_stream_queue_buffer(pwStream, pwBuffer);
}

std::vector<uint32_t> AudioOutputStream::parsePreferredRates(const Napi::Object& options)
{
    if (!options.Has("preferredRates") || !options.Get("preferredRates").IsArray()) {
        // Default to the current rate if no preferred rates provided
        return { this->rate };
    }

    std::vector<uint32_t> preferredRates;
    auto ratesArray = options.Get("preferredRates").As<Napi::Array>();
    for (uint32_t i = 0; i < ratesArray.Length(); i++) {
        auto rateValue = ratesArray.Get(i).As<Napi::Number>().Uint32Value();
        preferredRates.push_back(rateValue);
    }
    return preferredRates;
}
