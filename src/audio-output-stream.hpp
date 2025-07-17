#ifndef PIPEWIRE_STREAM_HPP
#define PIPEWIRE_STREAM_HPP

#include <napi.h>
#include <pipewire/pipewire.h>
#include <pipewire/thread-loop.h>
#include <queue>
#include <spa/param/audio/raw.h>
#include <spa/param/latency.h>
#include <vector>

#include "session.hpp"

struct js_buffer {
    uint8_t* buffer;
    size_t size;
};

class AudioOutputStream : public Napi::ObjectWrap<AudioOutputStream> {

public:
    static Napi::FunctionReference constructor;
    static Napi::Function init(Napi::Env env);

    AudioOutputStream(const Napi::CallbackInfo& info);
    ~AudioOutputStream();

    // JS-callable
    Napi::Value connect(const Napi::CallbackInfo& info);
    Napi::Value disconnect(const Napi::CallbackInfo& info);
    Napi::Value getBufferSize(const Napi::CallbackInfo& info);
    Napi::Value isReady(const Napi::CallbackInfo& info);
    Napi::Value isFinished(const Napi::CallbackInfo& info);
    Napi::Value write(const Napi::CallbackInfo& info);
    Napi::Value destroy(const Napi::CallbackInfo& info);

    Napi::Promise create(PipeWireSession* session, const Napi::Object& options);
    void initCallbacks(Napi::Env& env, const Napi::Object& options);
    pw_stream* getStream();
    uint32_t getRate();
    uint32_t getChannels();
    uint32_t getBytesPerFrame();

    void onStateChange(pw_stream_state state, const char* error);
    void onPropsChange(const spa_pod* param);
    void onFormatChange(const spa_pod* param);
    void onLatencyChange(const spa_pod* param);
    void onUnknownParamChange(uint32_t param);

    void fillBuffer(uint8_t* buffer, uint count);

private:
    PipeWireSession* session;
    pw_stream* stream;
    spa_audio_format format;
    uint32_t bytesPerSample;
    uint32_t rate;
    uint32_t channels;

    uint frameBufferSize;
    uint queuedFrameCount;
    std::queue<Napi::Reference<Napi::ArrayBuffer>> bufferRefs;
    std::queue<js_buffer> buffers;
    uint currentBufferOffset;

    Napi::ThreadSafeFunction stateChangedCallback;
    Napi::ThreadSafeFunction paramChangedCallback;
    Napi::ThreadSafeFunction formatChangeCallback;
    Napi::ThreadSafeFunction latencyCallback;

    Napi::ObjectReference props;
    Napi::ThreadSafeFunction propsCallback;

    Napi::Promise::Deferred* readyDeferral;
    Napi::ThreadSafeFunction readySignal;

    Napi::Promise::Deferred* finishedDeferral;
    Napi::ThreadSafeFunction finishedSignal;

    Napi::Promise::Deferred* disconnectDeferral;
    Napi::ThreadSafeFunction disconnectSignal;

    bool destroyed = false;

    void initCallbacks(const Napi::Object& options);
    void initStream(std::string name, pw_properties* properties);

    void setProps(Napi::Env env, const spa_pod_object* properties);
    void setProp(const char* key, spa_pod* value);
    void setChannelProp(uint32_t channel, const char* key, Napi::Value value);

    // Helper methods for connect()
    std::vector<spa_audio_format> parsePreferredFormats(const Napi::Object& options);
    std::vector<uint32_t> parsePreferredRates(const Napi::Object& options);
    void buildFormatParams(struct spa_pod_builder& podBuilder,
        const std::vector<spa_audio_format>& preferredFormats,
        const std::vector<uint32_t>& preferredRates);
    void connectStream(const std::vector<spa_audio_format>& preferredFormats,
        const std::vector<uint32_t>& preferredRates);

    void _destroy();
};

#endif // PIPEWIRE_STREAM_HPP
