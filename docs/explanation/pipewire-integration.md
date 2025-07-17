# PipeWire Integration

Understanding how the PipeWire Node.js Client integrates with the PipeWire multimedia framework and the technical decisions behind this integration.

## What is PipeWire?

[PipeWire](https://pipewire.org/) is a modern multimedia framework for Linux that provides:

- **Low-latency audio routing** - Professional-grade audio performance
- **Dynamic graph management** - Applications can connect and disconnect dynamically
- **Format negotiation** - Automatic conversion between different audio formats
- **Security model** - Sandboxed applications with controlled access
- **JACK/ALSA/PulseAudio compatibility** - Works with existing audio applications

## Integration Architecture

### High-Level Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   JavaScript    │    │   Node.js Addon  │    │    PipeWire    │
│   Application   │◄──►│   (C++ N-API)    │◄──►│   Framework    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                       ▲
         │                        │                       │
    TypeScript API         Native C++ Core          System Audio
```

### Session Management

#### PipeWire Core Connection

```cpp
// C++ Implementation (simplified)
class PipeWireSession {
private:
    pw_main_loop* mainLoop;
    pw_context* context;
    pw_core* core;

public:
    PipeWireSession() {
        // Initialize PipeWire main loop
        mainLoop = pw_main_loop_new(nullptr);

        // Create context
        context = pw_context_new(
            pw_main_loop_get_loop(mainLoop),
            nullptr, 0
        );

        // Connect to PipeWire daemon
        core = pw_context_connect(context, nullptr, 0);
    }
};
```

The session represents a connection to the PipeWire daemon and manages:

- Main event loop integration
- Core connection lifecycle
- Error handling and reconnection
- Resource cleanup

#### JavaScript Session API

```typescript
// TypeScript wrapper
export async function startSession(): Promise<Session> {
  const nativeSession = await createNativeSession();
  return new Session(nativeSession);
}

class Session {
  constructor(private nativeHandle: NativeSession) {}

  async createAudioOutputStream(options: AudioOutputStreamOptions) {
    return new AudioOutputStream(await this.nativeHandle.createStream(options));
  }

  async [Symbol.asyncDispose]() {
    await this.nativeHandle.destroy();
  }
}
```

### Stream Management

#### PipeWire Stream Creation

```cpp
// C++ Stream Implementation (simplified)
class AudioOutputStream {
private:
    pw_stream* stream;
    spa_audio_info_raw audioInfo;

public:
    void connect(const StreamOptions& options) {
        // Setup audio format information
        spa_audio_info_raw_init(&audioInfo);
        audioInfo.format = selectOptimalFormat(options.quality);
        audioInfo.rate = selectOptimalRate(options.quality);
        audioInfo.channels = options.channels;

        // Create PipeWire stream
        stream = pw_stream_new_simple(
            core,
            options.name.c_str(),
            pw_properties_new(
                PW_KEY_MEDIA_TYPE, "Audio",
                PW_KEY_MEDIA_CATEGORY, "Playback",
                PW_KEY_MEDIA_ROLE, options.role.c_str(),
                nullptr
            ),
            &streamEvents,
            this
        );

        // Connect stream with format negotiation
        pw_stream_connect(
            stream,
            PW_DIRECTION_OUTPUT,
            PW_ID_ANY,
            PW_STREAM_FLAG_AUTOCONNECT | PW_STREAM_FLAG_MAP_BUFFERS,
            params, numParams
        );
    }
};
```

#### Format Negotiation Process

```cpp
// Format selection based on quality level
spa_audio_format selectOptimalFormat(AudioQuality quality) {
    switch (quality) {
        case AudioQuality::High:
            // Try Float64 → Float32 → Int32 → Int16
            if (supportsFormat(SPA_AUDIO_FORMAT_F64)) return SPA_AUDIO_FORMAT_F64;
            if (supportsFormat(SPA_AUDIO_FORMAT_F32)) return SPA_AUDIO_FORMAT_F32;
            if (supportsFormat(SPA_AUDIO_FORMAT_S32)) return SPA_AUDIO_FORMAT_S32;
            return SPA_AUDIO_FORMAT_S16;

        case AudioQuality::Standard:
            // Try Float32 → Float64 → Int16 → Int32
            if (supportsFormat(SPA_AUDIO_FORMAT_F32)) return SPA_AUDIO_FORMAT_F32;
            if (supportsFormat(SPA_AUDIO_FORMAT_F64)) return SPA_AUDIO_FORMAT_F64;
            if (supportsFormat(SPA_AUDIO_FORMAT_S16)) return SPA_AUDIO_FORMAT_S16;
            return SPA_AUDIO_FORMAT_S32;

        case AudioQuality::Efficient:
            // Try Int16 → Int32 → Float32 → Float64
            if (supportsFormat(SPA_AUDIO_FORMAT_S16)) return SPA_AUDIO_FORMAT_S16;
            if (supportsFormat(SPA_AUDIO_FORMAT_S32)) return SPA_AUDIO_FORMAT_S32;
            if (supportsFormat(SPA_AUDIO_FORMAT_F32)) return SPA_AUDIO_FORMAT_F32;
            return SPA_AUDIO_FORMAT_F64;
    }
}
```

### Audio Data Flow

#### Sample Processing Pipeline

```
JavaScript Generator → Node.js Addon → Format Conversion → PipeWire Buffer → Audio Hardware

1. JavaScript yields samples as Float64 Numbers (-1.0 to +1.0)
2. C++ addon receives samples via N-API
3. Samples converted to negotiated format (Int16/Int32/Float32/Float64)
4. Converted samples written to PipeWire buffer
5. PipeWire routes to audio hardware via selected output device
```

#### Buffer Management

```cpp
// PipeWire buffer callback
void onStreamProcess(void* userData) {
    auto* stream = static_cast<AudioOutputStream*>(userData);

    // Get buffer from PipeWire
    pw_buffer* pwBuffer = pw_stream_dequeue_buffer(stream->stream);
    if (!pwBuffer) return;

    spa_buffer* spaBuffer = pwBuffer->buffer;
    spa_data* data = &spaBuffer->datas[0];

    // Get samples from JavaScript
    auto samples = stream->getSamplesFromJS();

    // Convert and write to PipeWire buffer
    stream->convertAndWriteSamples(samples, data->data, data->maxsize);

    // Queue buffer back to PipeWire
    pw_stream_queue_buffer(stream->stream, pwBuffer);
}
```

## PipeWire Features Utilized

### Dynamic Format Negotiation

PipeWire automatically negotiates the best audio format between our application and the audio system:

```cpp
// We specify supported formats in order of preference
const spa_pod* audioFormats[] = {
    spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat,
        &audioInfo),
    // Additional format variants...
};

// PipeWire selects the best match with the audio system
pw_stream_connect(stream, PW_DIRECTION_OUTPUT, PW_ID_ANY,
    PW_STREAM_FLAG_AUTOCONNECT, audioFormats, numFormats);
```

### Automatic Device Routing

PipeWire handles device selection and routing:

```typescript
// JavaScript doesn't need to specify output device
const stream = await session.createAudioOutputStream({
  name: "My Audio App",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music", // Hint for PipeWire routing
});

// PipeWire automatically:
// 1. Selects appropriate output device
// 2. Handles device changes (e.g., headphones plugged in)
// 3. Manages sample rate conversion if needed
// 4. Routes to correct application category
```

### Security and Sandboxing

PipeWire provides security isolation:

```cpp
// Applications run with limited permissions
pw_properties* props = pw_properties_new(
    PW_KEY_MEDIA_TYPE, "Audio",
    PW_KEY_MEDIA_CATEGORY, "Playback",
    PW_KEY_MEDIA_ROLE, "Music",
    PW_KEY_APP_NAME, "Node.js Audio App",
    nullptr
);

// PipeWire enforces:
// - Only audio output permissions (no recording without explicit permission)
// - Proper application categorization
// - Resource limits and priority management
```

### Real-Time Scheduling

PipeWire manages real-time priorities:

```cpp
// PipeWire automatically:
// - Sets appropriate thread priorities
// - Manages CPU scheduling for audio threads
// - Handles buffer underruns gracefully
// - Provides low-latency audio paths

// Our addon works with PipeWire's scheduling
void streamProcessCallback(void* userData) {
    // This runs in PipeWire's real-time thread
    // Must be lock-free and fast
    processAudioSamples();
}
```

## Integration Benefits

### Automatic Hardware Adaptation

```typescript
// Same code works across different hardware
await using stream = await session.createAudioOutputStream({
  quality: AudioQuality.Standard,
  channels: 2,
});

await stream.connect();

// PipeWire automatically handles:
// - 44.1kHz vs 48kHz hardware
// - Different bit depths (16/24/32-bit)
// - USB audio interfaces vs built-in audio
// - Professional audio hardware vs consumer devices
```

### Dynamic Reconfiguration

```typescript
// Application continues working during system changes
const stream = await session.createAudioOutputStream(options);
await stream.connect();

// PipeWire handles automatically:
// - User switching output devices
// - Audio hardware being plugged/unplugged
// - Sample rate changes
// - Format changes
// - Device failures and recovery
```

### System Integration

```typescript
// Proper integration with desktop audio
await using stream = await session.createAudioOutputStream({
  name: "Music Player",
  role: "Music", // Integrates with volume controls
  quality: AudioQuality.High,
});

// Benefits:
// - Appears in system volume mixer
// - Respects system audio policies
// - Works with desktop audio routing
// - Integrates with audio session management
```

## Technical Challenges and Solutions

### Thread Safety

**Challenge**: PipeWire callbacks run in real-time threads, JavaScript runs in main thread.

**Solution**: Lock-free queues for data transfer:

```cpp
// Lock-free circular buffer for samples
class LockFreeAudioQueue {
    std::atomic<size_t> writeIndex{0};
    std::atomic<size_t> readIndex{0};
    std::vector<float> buffer;
public:
    void write(const std::vector<float>& samples) {
        // Lock-free write from JavaScript thread
    }

    size_t read(float* output, size_t maxSamples) {
        // Lock-free read from PipeWire callback
    }
};
```

### Memory Management

**Challenge**: Efficient sample transfer between JavaScript and C++.

**Solution**: Minimize allocations, reuse buffers:

```cpp
class SampleBuffer {
    std::vector<double> jsBuffer;    // Reused for JavaScript samples
    std::vector<float> nativeBuffer; // Reused for native samples

public:
    void processSamples(napi_env env, napi_value jsGenerator) {
        // Reuse existing buffers, minimize allocations
        jsBuffer.clear();
        extractSamplesFromJS(env, jsGenerator, jsBuffer);

        nativeBuffer.resize(jsBuffer.size());
        convertSamples(jsBuffer, nativeBuffer);

        queueForPipeWire(nativeBuffer);
    }
};
```

### Error Handling

**Challenge**: Propagating PipeWire errors to JavaScript properly.

**Solution**: Error translation and proper async handling:

```cpp
class StreamErrorHandler {
public:
    static void onStreamError(void* userData, uint32_t id,
                             int seq, int res, const char* message) {
        auto* stream = static_cast<AudioOutputStream*>(userData);

        // Translate PipeWire error to JavaScript exception
        std::string jsError = translatePipeWireError(res, message);
        stream->scheduleJSException(jsError);
    }
};
```

## Future Integration Opportunities

### Advanced PipeWire Features

```cpp
// Potential future enhancements:

// 1. Input streams (microphone, line-in)
pw_stream_connect(stream, PW_DIRECTION_INPUT, ...);

// 2. MIDI integration
pw_stream_new(..., PW_KEY_MEDIA_TYPE, "Midi", ...);

// 3. Video streams
pw_stream_new(..., PW_KEY_MEDIA_TYPE, "Video", ...);

// 4. Custom processing nodes
pw_impl_node_new(...);

// 5. Stream linking and routing
pw_link_new(...);
```

### Enhanced Quality Control

```typescript
// Potential API extensions:
interface AdvancedStreamOptions {
  quality: AudioQuality;
  preferredLatency?: number; // Hint for buffer sizes
  preferredSampleRate?: number; // Specific rate preference
  allowResampling?: boolean; // Control format conversion
  priorityLevel?: "normal" | "high" | "realtime";
}
```

## Summary

The PipeWire integration provides:

- **Professional audio performance** through direct PipeWire API usage
- **Automatic format negotiation** eliminating manual audio configuration
- **System integration** with proper desktop audio behavior
- **Security and isolation** through PipeWire's sandboxing model
- **Real-time capabilities** with lock-free audio processing
- **Hardware abstraction** working across diverse audio systems

This integration allows JavaScript developers to create professional-quality audio applications without needing deep knowledge of Linux audio systems, while still providing access to the full capabilities of modern audio hardware.
