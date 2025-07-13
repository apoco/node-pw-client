# PipeWire Client for Node.js

A high-performance Node.js wrapper for developing PipeWire audio clients, providing a modern TypeScript/JavaScript API for audio streaming and processing on Linux systems.

## 🎵 What is this project?

This project is a native Node.js addon that bridges the gap between JavaScript/TypeScript applications and the [PipeWire](https://pipewire.org/) multimedia framework. It allows developers to create audio applications, synthesizers, audio processors, and streaming solutions using familiar JavaScript patterns while leveraging the low-latency, professional-grade capabilities of PipeWire.

**Key Features:**

- 🚀 **Low-latency audio streaming** - Direct PipeWire integration for professional audio applications
- 📦 **Modern TypeScript API** - Fully typed, promise-based interface with async/await support
- 🔄 **Real-time audio processing** - Stream audio samples with generator functions and iterators
- 🎛️ **Dynamic format support** - Multiple audio formats (Float32, Float64, Int16, Int32, etc.)
- 🔧 **Flexible configuration** - Control sample rates, channels, media properties, and more
- 🗑️ **Resource management** - Automatic cleanup with `using` declarations and Symbol.asyncDispose

## 🚀 Quick Start

### Prerequisites

- Linux system with PipeWire installed
- Node.js 22+ (ESM modules required)
- Build tools: `gcc`, `make`, `python3`
- PipeWire development headers: `libpipewire-0.3-dev`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd node-pw-client

# Install dependencies and build
npm install
npm run build
```

### Basic Usage

```typescript
import { startSession, AudioFormat } from "pw-client";

// Create a PipeWire session with automatic cleanup
await using session = await startSession();

// Create an audio output stream
await using stream = await session.createAudioOutputStream({
  name: "My Audio App",
  format: AudioFormat.Float64,
  rate: 48_000,
  channels: 1,
  media: {
    type: "Audio",
    role: "Music",
    category: "Playback",
  },
});

// Connect to PipeWire
await stream.connect();

// Generate and stream audio (sine wave example)
function* generateSineWave(frequency: number, rate: number, duration: number) {
  const samples = rate * duration;
  for (let i = 0; i < samples; i++) {
    yield Math.sin((2 * Math.PI * frequency * i) / rate) * 0.5;
  }
}

// Stream a 440Hz sine wave for 2 seconds
await stream.write(generateSineWave(440, 48_000, 2));
```

## 🏗️ Design Philosophy

### Modern JavaScript Patterns

The library embraces modern JavaScript/TypeScript features and patterns:

- **ESM modules** - Full ES module support for modern Node.js applications
- **Async/await** - Promise-based APIs throughout, no callbacks
- **Resource management** - Uses `Symbol.asyncDispose` for automatic cleanup
- **Generator functions** - Stream audio data using iterators and generators
- **Strong typing** - Full TypeScript support with comprehensive type definitions

### Low-Level Performance, High-Level API

The design balances performance with developer experience:

- **Native C++ core** - Critical audio paths implemented in C++ for maximum performance
- **Minimal overhead** - Direct memory operations and efficient data transfer
- **JavaScript convenience** - High-level abstractions for common audio tasks
- **Flexible data flow** - Support for various audio formats and processing patterns

### PipeWire Integration

The library follows PipeWire's design principles:

- **Professional audio** - Built for low-latency, real-time audio applications
- **Graph-based processing** - Streams can be connected to PipeWire's audio graph
- **Dynamic configuration** - Runtime format negotiation and property updates
- **Session management** - Proper lifecycle management of PipeWire resources

## 📚 API Reference

### Core Classes

#### `PipeWireSession`

Main session manager for PipeWire connections.

```typescript
class PipeWireSession {
  static start(): Promise<PipeWireSession>;
  createAudioOutputStream(
    opts?: AudioOutputStreamOpts
  ): Promise<AudioOutputStream>;
  [Symbol.asyncDispose](): Promise<void>;
}
```

#### `AudioOutputStream`

Represents an audio output stream for playback.

```typescript
interface AudioOutputStream extends EventEmitter {
  connect(): Promise<void>;
  write(samples: Iterable<number>): Promise<void>;
  isFinished(): Promise<void>;
  [Symbol.asyncDispose](): Promise<void>;

  // Events
  on(event: "stateChange", listener: (state: StreamState) => void): this;
  on(event: "formatChange", listener: (format: AudioFormat) => void): this;
  on(event: "latencyChange", listener: (latency: Latency) => void): this;
  on(
    event: "propsChange",
    listener: (props: AudioOutputStreamProps) => void
  ): this;
  on(event: "error", listener: (error: Error) => void): this;
}
```

#### `AudioFormat`

Enumeration of supported audio formats.

```typescript
enum AudioFormat {
  Float32, // 32-bit floating point
  Float64, // 64-bit floating point
  Int16, // 16-bit signed integer
  Int32, // 32-bit signed integer
  Uint16, // 16-bit unsigned integer
  Uint32, // 32-bit unsigned integer
}
```

### Configuration Options

```typescript
type AudioOutputStreamOpts = {
  name?: string; // Stream name in PipeWire graph
  format?: AudioFormat; // Audio sample format
  rate?: number; // Sample rate (Hz)
  channels?: number; // Number of audio channels
  media?: {
    type?: "Audio" | "Video" | "Midi";
    category?: "Playback" | "Capture" | "Duplex" | "Monitor" | "Manager";
    role?:
      | "Movie"
      | "Music"
      | "Camera"
      | "Screen"
      | "Communication"
      | "Game"
      | "Notification"
      | "DSP"
      | "Production"
      | "Accessibility"
      | "Test";
  };
};
```

## 💻 Examples

### White Noise Generator

```typescript
import { startSession } from "pw-client";

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  rate: 48_000,
  channels: 1,
});

await stream.connect();

// Generate 4 seconds of white noise
await stream.write(
  (function* () {
    for (let i = 0; i < 4 * 48_000; i++) {
      yield Math.random() * 0.5;
    }
  })()
);
```

### Multi-tone Generator with Effects

```typescript
function* generateTone(frequency: number, rate: number, duration: number) {
  const samples = rate * duration;
  for (let i = 0; i < samples; i++) {
    yield Math.sin((2 * Math.PI * frequency * i) / rate);
  }
}

function* amplify(volume: number, samples: Iterable<number>) {
  for (const sample of samples) {
    yield sample * volume;
  }
}

function* mix(...streams: Array<Iterable<number>>) {
  const iterators = streams.map((s) => s[Symbol.iterator]());
  while (true) {
    const results = iterators.map((it) => it.next());
    if (results.every((r) => r.done)) break;

    yield results.reduce((sum, r) => sum + (r.done ? 0 : r.value), 0) /
      streams.length;
  }
}

// Create a chord (C major triad)
const chord = mix(
  amplify(0.3, generateTone(261.63, 48_000, 3)), // C4
  amplify(0.3, generateTone(329.63, 48_000, 3)), // E4
  amplify(0.3, generateTone(392.0, 48_000, 3)) // G4
);

await stream.write(chord);
```

## 🔨 Development Status

### ✅ Currently Working

- **Core PipeWire integration** - Session management, stream creation
- **Audio output streams** - Playback with multiple format support
- **TypeScript bindings** - Full type safety and modern JS features
- **Event system** - Real-time notifications for state/format changes
- **Resource management** - Automatic cleanup and memory management
- **Basic examples** - Tone generation, noise, and effects processing

### 🚧 In Progress

- **Audio input streams** - Capture and recording capabilities
- **Format negotiation** - Dynamic sample rate and format adaptation
- **Stream connection** - Connect streams to specific PipeWire nodes
- **Enhanced error handling** - Better error reporting and recovery

### 🎯 Next Major Goals

1. **Audio Input Support**

   - Implement capture streams for audio recording
   - Support for monitoring and duplex streams
   - Real-time audio processing pipelines

2. **Advanced Stream Management**

   - Stream connection to specific PipeWire nodes/ports
   - Dynamic stream properties and parameter updates
   - Stream synchronization and timing

3. **Performance Optimization**

   - Zero-copy audio buffers where possible
   - Optimized format conversion routines
   - Reduced JavaScript ↔ C++ overhead

4. **Extended Format Support**

   - Additional audio formats (24-bit, DSD, etc.)
   - Multi-channel and surround sound configurations
   - Planar and interleaved audio layouts

5. **Developer Experience**
   - Comprehensive documentation and tutorials
   - Advanced examples (synthesizers, effects, analyzers)
   - Debugging and profiling tools

## 🤝 Contributing

We welcome contributions! This project is in active development, and there are many opportunities to help.

### How to Contribute

1. **Fork the repository** and create a feature branch
2. **Set up the development environment**:
   ```bash
   npm install
   npm run build
   ```
3. **Make your changes** following the coding standards
4. **Test your changes** with the examples
5. **Submit a pull request** with a clear description

### Areas Where Help is Needed

- **Audio Input Streams** - Implementing capture functionality
- **Documentation** - API docs, tutorials, and examples
- **Testing** - Unit tests, integration tests, and CI/CD
- **Platform Support** - Testing on different Linux distributions
- **Performance** - Profiling and optimization
- **Examples** - Real-world audio applications and demos

### Development Guidelines

- **Modern C++** - Use C++20 features, RAII patterns, and smart pointers
- **TypeScript** - Full type safety, prefer `unknown` over `any`
- **Error Handling** - Use exceptions in C++, promises rejection in JS
- **Memory Management** - Proper cleanup of PipeWire resources
- **Code Style** - Use Prettier for TypeScript, consistent C++ formatting

### Building and Testing

```bash
# Build native addon (debug mode)
npm run build:native:debug

# Build TypeScript
npx tsc

# Build everything
npm run build

# Run examples
npx tsx examples/hello-pipewire.mts
npx tsx examples/noise.mts
```

### C++ Development

The native addon uses:

- **Node-API** for JavaScript ↔ C++ bindings
- **PipeWire 0.3** for audio system integration
- **Modern C++20** features and patterns

Key files:

- `src/pipewire.cpp` - Main addon entry point
- `src/session.cpp/.hpp` - PipeWire session management
- `src/audio-output-stream.cpp/.hpp` - Audio streaming implementation
- `binding.gyp` - Native build configuration

---

**License:** MIT  
**Author:** Jacob Page <jacob.h.page@gmail.com>  
**Keywords:** sound, pipewire, linux, audio, streaming, real-time

For questions, issues, or feature requests, please open an issue on GitHub.
