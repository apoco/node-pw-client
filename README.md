# PipeWire Client for Node.js

A high-performance Node.js wrapper for developing PipeWire audio clients, providing a modern TypeScript/JavaScript API for audio streaming and processing on Linux systems.

## 🎵 What is this project?

This project is a native Node.js addon that bridges the gap between JavaScript/TypeScript applications and the [PipeWire](https://pipewire.org/) multimedia framework. It allows developers to create audio applications, synthesizers, audio processors, and streaming solutions using familiar JavaScript patterns while leveraging the low-latency, professional-grade capabilities of PipeWire.

**Key Features:**

- 🚀 **Low-latency audio streaming** - Direct PipeWire integration for professional audio applications
- 📦 **Quality-Based API** - Choose `High`, `Standard`, or `Efficient` quality levels
- 🔄 **Real-time audio processing** - Stream audio samples with generator functions and iterators
- 🎛️ **Automatic format negotiation** - Works with JavaScript Numbers (Float64) and converts optimally
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
git clone <repository-url>
cd node-pw-client
npm install
npm run build
```

### Basic Usage

```typescript
import { startSession, AudioQuality } from "@jacobsoft/pipewire";

// Create a PipeWire session with automatic cleanup
await using session = await startSession();

// Create an audio output stream - simple quality-based API!
await using stream = await session.createAudioOutputStream({
  name: "My Audio App",
  quality: AudioQuality.Standard, // 🎯 Auto-negotiates format AND rate!
  channels: 2, // Stereo for proper playback
});

await stream.connect();

// Use the negotiated values - no more hard-coded rates!
console.log(`Connected: ${stream.format.description} @ ${stream.rate}Hz`);

// Generate audio using JavaScript Numbers (range: -1.0 to +1.0)
function* generateTone(frequency: number, duration: number) {
  const samples = Math.floor(duration * stream.rate * stream.channels);
  const cycle = (Math.PI * 2) / stream.rate;
  let phase = 0;

  for (let i = 0; i < samples; i += stream.channels) {
    const sample = Math.sin(phase * frequency) * 0.1; // 10% volume
    // Generate samples for each channel
    for (let ch = 0; ch < stream.channels; ch++) {
      yield sample;
    }
    phase += cycle;
  }
}

await stream.write(generateTone(440, 2.0)); // 2 second A4 note
```

## 📚 Documentation

- **[🎯 Audio Quality API](docs/AUDIO_QUALITY_API.md)** - Quality-based API (recommended for most users)
- **[📏 Audio Samples Reference](docs/AUDIO_SAMPLES_REFERENCE.md)** - Quick reference for sample values and common patterns
- **[🏗️ Architecture](docs/ARCHITECTURE.md)** - Technical overview and design principles
- **[📝 Coding Style](docs/CODING_STYLE.md)** - Code style guidelines and best practices
- **[🔬 Development Log](docs/DEVLOG.md)** - Development notes and decision history

## 🎯 Quality Levels

The API uses quality levels instead of technical audio formats:

| Quality                  | Best For                    | CPU Usage | Compatibility |
| ------------------------ | --------------------------- | --------- | ------------- |
| `AudioQuality.High`      | Music production, mastering | Highest   | Excellent     |
| `AudioQuality.Standard`  | General apps, games         | Medium    | Excellent     |
| `AudioQuality.Efficient` | Voice, notifications        | Lowest    | Good          |

**You always work with JavaScript Numbers in the range -1.0 to +1.0** - the library handles format conversion automatically!

## 🎵 Examples

### Different Quality Levels

```typescript
// High quality for music production
const musicStream = await session.createAudioOutputStream({
  quality: AudioQuality.High,
  channels: 2,
  role: "Music",
});

// Efficient for system sounds
const notificationStream = await session.createAudioOutputStream({
  quality: AudioQuality.Efficient,
  channels: 2,
  role: "Notification",
});
```

### Stereo Audio

```typescript
// Generate stereo noise using negotiated stream properties
function* generateStereoNoise(stream: AudioOutputStream, duration: number) {
  const samples = Math.floor(duration * stream.rate * stream.channels);

  for (let i = 0; i < samples; i += stream.channels) {
    // Generate samples for each channel
    for (let ch = 0; ch < stream.channels; ch++) {
      yield (Math.random() - 0.5) * 0.1; // Random noise per channel
    }
  }
}

await stream.write(generateStereoNoise(stream, 3.0)); // 3 seconds
```

More examples available in the [`examples/`](examples/) directory.

## 🏗️ Design Philosophy

- **Modern JavaScript Patterns** - ESM modules, async/await, resource management with `using`
- **Low-Level Performance, High-Level API** - Native C++ core with JavaScript convenience
- **PipeWire Integration** - Professional audio with dynamic format negotiation
- **User-Friendly** - Quality levels instead of technical formats, automatic conversions

## 🤝 Contributing

1. Read the [Coding Style](docs/CODING_STYLE.md) guidelines
2. Check the [Architecture](docs/ARCHITECTURE.md) documentation
3. Look at existing examples for patterns
4. Submit pull requests with tests and documentation

## 🛠️ Building

```bash
# Development setup
npm install
npm run build

# Run examples
npx tsx examples/hello-pipewire.mts
npx tsx examples/quality-demo.mts
```

## 📄 License

MIT License - see LICENSE file for details

---

**Keywords:** audio, pipewire, linux, streaming, real-time, typescript, node.js
