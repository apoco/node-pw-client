# PipeWire Node.js Client

Node.js library for PipeWire audio programming. Build audio applications, synthesizers, and streaming solutions using modern JavaScript patterns.

## ✨ Why This Library?

- **🚀 Real-Time Performance** - Native C++ core optimized for low-latency audio
- **🎵 JavaScript-Friendly** - Develop using idiomatic JavaScript
- **🔧 Modern Patterns** - ES modules, iterators, explicit resource managment with `using`, built with TypeScript
- **🎛️ PipeWire Native** - Direct integration with Linux's professional audio system

## 🚀 Quick Start

```bash
npm install pw-client
```

```typescript
import { startSession, AudioQuality } from "pw-client";

// Create processing thread for PipeWire
const session = await startSession();

try {
  // Create audio stream
  const stream = await session.createAudioOutputStream({
    name: "My Audio App",
    quality: AudioQuality.Standard, // Auto-negotiates optimal format
    channels: 2, // Stereo output
  });

  try {
    await stream.connect();

    // Generate PCM audio samples
    function* generateTone(frequency: number, duration: number) {
      const totalSamples = duration * stream.rate * stream.channels;
      const cycle = (Math.PI * 2) / stream.rate;
      let phase = 0;

      for (let i = 0; i < totalSamples; i += stream.channels) {
        const sample = Math.sin(phase * frequency) * 0.2; // 20% volume

        // Output to both stereo channels
        for (let ch = 0; ch < stream.channels; ch++) {
          yield sample;
        }
        phase += cycle;
      }
    }

    // Play 2-second A4 note
    await stream.write(generateTone(440, 2.0));
  } finally {
    await stream.dispose(); // Clean up stream
  }
} finally {
  await session.dispose(); // Clean up session
}
```

## 📚 Documentation

### 🎓 [Tutorials](docs/tutorials/index.md) - _Learn by doing_

- **[Getting Started](docs/tutorials/getting-started.md)** - Your first PipeWire audio application
- **[Building a Simple Synthesizer](docs/tutorials/simple-synthesizer.md)** - Create a tone generator
- **[Working with Stereo Audio](docs/tutorials/stereo-audio.md)** - Multi-channel audio programming

### 🔧 [How-to Guides](docs/how-to-guides/) - _Solve specific problems_

- **[Choose the Right Audio Quality](docs/how-to-guides/choose-audio-quality.md)** - Match quality to your use case
- **[Generate Common Waveforms](docs/how-to-guides/generate-waveforms.md)** - Sine, square, sawtooth waves

### 📖 [Reference](docs/reference/) - _Look up technical details_

- **[API Reference](docs/reference/api.md)** - Complete class and method documentation
- **[Audio Sample Formats](docs/reference/audio-samples.md)** - Sample value ranges and formats

### 💡 [Explanation](docs/explanation/) - _Understand the concepts_

- **[Architecture Overview](docs/explanation/architecture.md)** - How the library is designed
- **[Quality-Based API Design](docs/explanation/quality-api-design.md)** - Why we chose quality over formats
- **[Resource Management](docs/explanation/resource-management.md)** - Manual vs automatic cleanup patterns

## 🎵 Examples

Check out the [`examples/`](examples/) directory for complete working demos. Use `npx tsx` to run them without having to compile:

```bash
npx tsx examples/hello-pipewire.mts
```

## 📋 Prerequisites

- **Linux with PipeWire** - PipeWire 0.3+ required
- **Node.js 22+** - ES modules and modern features required
- **Build tools** - GCC, make, Python 3
- **PipeWire headers** - `libpipewire-0.3-dev` package

> **Note:** The examples above use manual cleanup compatible with Node.js 22 LTS. For Node.js 24+, you can use `await using` for automatic resource management. See the [tutorials](docs/tutorials/) for both patterns.

## 🤝 Contributing

1. Read [Contributing Guidelines](docs/explanation/contributing.md)
2. Check [Architecture Overview](docs/explanation/architecture.md)
3. Follow [Coding Style](docs/explanation/coding-standards.md)
4. Run examples to test changes

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**🎵 Build amazing audio applications with modern JavaScript and professional PipeWire performance!**
