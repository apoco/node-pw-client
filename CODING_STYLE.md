# Developer Preferences & Coding Standards

This file documents Jacob's coding preferences, standards, and conventions for this project.

## 🎯 General Development Philosophy

### Code Quality Principles

- **Clarity over cleverness** - Code should be self-documenting
- **Performance matters** - This is real-time audio, optimize critical paths
- **Type safety** - Leverage TypeScript's type system fully
- **Resource safety** - Use RAII in C++, automatic cleanup in JS
- **Functional patterns** - Prefer immutability and pure functions where possible

### Error Handling Philosophy

- **Fail fast** - Don't continue with invalid state
- **Meaningful errors** - Error messages should help debugging
- **Consistent patterns** - Exceptions in C++, promise rejection in JS
- **Graceful degradation** - Audio applications should handle errors gracefully

## 💻 Language-Specific Preferences

### TypeScript/JavaScript

#### Type Safety

```typescript
// ✅ Prefer strong typing
function processAudio(samples: Float64Array): Float64Array {
  // Implementation
}

// ❌ Avoid any
function processAudio(samples: any): any {
  // Implementation
}

// ✅ Use unknown for truly unknown data
function parseConfig(data: unknown): Config {
  // Type narrowing implementation
}
```

#### Async Patterns

```typescript
// ✅ Prefer async/await
async function createStream(): Promise<AudioStream> {
  const session = await startSession();
  return session.createAudioOutputStream();
}

// ❌ Avoid callbacks
function createStream(
  callback: (err: Error | null, stream?: AudioStream) => void
) {
  // Callback implementation
}
```

#### Resource Management

```typescript
// ✅ Use Symbol.asyncDispose
await using session = await startSession();
await using stream = await session.createAudioOutputStream();

// ✅ Explicit cleanup when dispose not available
const session = await startSession();
try {
  // Use session
} finally {
  await session.destroy();
}
```

#### Generator Functions for Audio

```typescript
// ✅ Prefer generators for audio processing
function* amplify(volume: number, samples: Iterable<number>) {
  for (const sample of samples) {
    yield sample * volume;
  }
}

// ✅ Composable audio processing
function* audioChain(input: Iterable<number>) {
  yield* amplify(0.5, yield* filter(lowPass(1000), yield* input));
}
```

### C++

#### Modern C++ Patterns

```cpp
// ✅ Use RAII and smart pointers
class AudioStream {
private:
    std::unique_ptr<pw_stream, PwStreamDeleter> stream_;

public:
    AudioStream(pw_loop* loop)
        : stream_(pw_stream_new_simple(loop, "name", props, &callbacks, this)) {
        if (!stream_) {
            throw std::runtime_error("Failed to create stream");
        }
    }

    // Destructor automatically cleans up
    ~AudioStream() = default;
};

// ❌ Avoid raw pointers and manual cleanup
class AudioStream {
private:
    pw_stream* stream_;
public:
    AudioStream(pw_loop* loop) {
        stream_ = pw_stream_new_simple(loop, "name", props, &callbacks, this);
    }

    ~AudioStream() {
        if (stream_) {
            pw_stream_destroy(stream_);
        }
    }
};
```

#### Error Handling

```cpp
// ✅ Use exceptions for error reporting
void connectStream() {
    int result = pw_stream_connect(stream_.get(), /* ... */);
    if (result < 0) {
        throw std::runtime_error("Failed to connect stream: " + std::string(spa_strerror(result)));
    }
}

// ✅ Convert to JavaScript promise rejection
Napi::Promise connectAsync(const Napi::CallbackInfo& info) {
    auto deferred = Napi::Promise::Deferred::New(info.Env());

    try {
        connectStream();
        deferred.Resolve(info.Env().Undefined());
    } catch (const std::exception& e) {
        deferred.Reject(Napi::Error::New(info.Env(), e.what()).Value());
    }

    return deferred.Promise();
}
```

#### Threading and PipeWire

```cpp
// ✅ Always use PipeWire's thread lock
void withThreadLock(std::function<void()> fn) {
    pw_thread_loop_lock(loop_);
    try {
        fn();
    } catch (...) {
        pw_thread_loop_unlock(loop_);
        throw;
    }
    pw_thread_loop_unlock(loop_);
}

// ✅ RAII for thread locking
class ThreadLockGuard {
    pw_thread_loop* loop_;
public:
    ThreadLockGuard(pw_thread_loop* loop) : loop_(loop) {
        pw_thread_loop_lock(loop_);
    }
    ~ThreadLockGuard() {
        pw_thread_loop_unlock(loop_);
    }
};
```

## 📁 Project Structure Preferences

### File Organization

```
src/               # C++ source code
├── pipewire.cpp   # Main addon entry
├── session.*      # Session management
├── audio-*.cpp    # Audio streaming classes
└── promises.*     # Promise/async utilities

lib/               # TypeScript API layer
├── index.mts      # Main exports
├── session.mts    # Session wrapper
├── audio-*.mts    # Stream classes
└── types.mts      # Type definitions

examples/          # Usage examples
├── basic-*.mts    # Simple examples
└── advanced-*.mts # Complex examples

docs/              # Documentation
├── api/           # API reference
└── guides/        # Tutorials and guides
```

### Naming Conventions

#### TypeScript

- **Classes:** PascalCase (`AudioOutputStream`)
- **Functions:** camelCase (`createAudioStream`)
- **Constants:** SCREAMING_SNAKE_CASE (`DEFAULT_SAMPLE_RATE`)
- **Types:** PascalCase (`AudioFormat`)
- **Interfaces:** PascalCase (`AudioStreamOptions`)

#### C++

- **Classes:** PascalCase (`AudioOutputStream`)
- **Methods:** camelCase (`connectStream`)
- **Members:** snake*case with trailing underscore (`stream*`, `loop\_`)
- **Constants:** SCREAMING_SNAKE_CASE (`DEFAULT_BUFFER_SIZE`)

## 🧪 Testing Preferences

### Testing Strategy

- **Manual testing** with examples during development
- **Unit tests** for utility functions and TypeScript layer
- **Integration tests** for C++ ↔ JavaScript interaction
- **Performance tests** for audio latency and throughput

### Example-Driven Development

```typescript
// ✅ Examples should be runnable and demonstrative
// examples/synthesizer.mts
import { startSession, AudioFormat } from "../lib/index.mjs";

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Simple Synthesizer",
  format: AudioFormat.Float64,
  rate: 48_000,
  channels: 2,
});

function* oscillator(frequency: number, waveform: "sine" | "square" | "saw") {
  // Implementation that demonstrates real-world usage
}
```

## 🔧 Build & Development Workflow

### Preferred Commands

```bash
# Development build (debug mode)
npm run build:native:debug && npx tsc

# Full build
npm run build

# Run examples (for testing)
npx tsx examples/hello-pipewire.mts
npx tsx examples/noise.mts

# Type checking
npx tsc --noEmit
```

### Git Workflow

- **Feature branches** for new development
- **Descriptive commit messages** with context
- **Small, focused commits** when possible
- **Keep main branch stable**

## 🎨 Code Style

### Formatting

- **Prettier** for TypeScript/JavaScript
- **Consistent indentation** (2 spaces for TS, 4 for C++)
- **No trailing whitespace**
- **Single quotes** in TypeScript
- **Semicolons** in TypeScript

### Comments

```typescript
// ✅ Explain why, not what
// Use a larger buffer to reduce XRuns on slower systems
const bufferSize = 1024;

// ✅ Document complex audio algorithms
/**
 * Implements a simple low-pass filter using a single-pole IIR filter.
 * Cutoff frequency is approximated for real-time performance.
 */
function* lowPassFilter(
  cutoff: number,
  sampleRate: number,
  input: Iterable<number>
) {
  // Implementation
}
```

## 🚀 Performance Considerations

### Audio-Critical Code

- **Minimize allocations** in audio callback paths
- **Prefer stack allocation** over heap in C++
- **Use appropriate audio formats** (Float32 for most cases, Float64 for precision)
- **Profile regularly** with real-world examples

### JavaScript ↔ C++ Interface

- **Batch operations** to reduce crossing overhead
- **Use TypedArrays** for bulk data transfer
- **Minimize object creation** in hot paths

---

**Note:** These preferences should be followed for consistency, but can be discussed and evolved as the project grows.
