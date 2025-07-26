# Examples

This directory contains runnable code examples for the PipeWire Node.js Client library. These examples demonstrate real-world usage patterns and can be executed directly.

## 🚀 Running Examples

All examples are designed to run without compilation using `npx tsx`:

```bash
# Run a basic example
npx tsx examples/quick-start.mts

# Try the getting started tutorial
npx tsx examples/getting-started.mts

# Explore audio generation
npx tsx examples/simple-synthesizer.mts

# Learn about resource management
npx tsx examples/resource-cleanup-basic.mts

# Monitor stream events
npx tsx examples/stream-events.mts
```

## 📁 Example Categories

### Tutorials (Learning Path)

Start here if you're new to the library:

- **[`stereo-tutorial-mono-vs-stereo.mts`](stereo-tutorial-mono-vs-stereo.mts)** - Compare mono and stereo audio
- **[`stereo-tutorial-independent-channels.mts`](stereo-tutorial-independent-channels.mts)** - Create different audio per channel
- **[`stereo-tutorial-simple-panning.mts`](stereo-tutorial-simple-panning.mts)** - Basic left-right panning effect
- **[`stereo-tutorial-concepts.mts`](stereo-tutorial-concepts.mts)** - Key stereo audio concepts
- **[`stereo-tutorial-complete-demo.mts`](stereo-tutorial-complete-demo.mts)** - Complete stereo tutorial walkthrough

### Getting Started

- **[`quick-start.mts`](quick-start.mts)** - Complete audio output example
- **[`getting-started.mts`](getting-started.mts)** - Step-by-step tutorial example

### Audio Generation

- **[`simple-synthesizer.mts`](simple-synthesizer.mts)** - Basic tone generation
- **[`waveform-generation.mts`](waveform-generation.mts)** - Different waveform types
- **[`interactive-synthesizer.mts`](interactive-synthesizer.mts)** - User-controlled synth

### Audio Processing

- **[`basic-mixing.mts`](basic-mixing.mts)** - Simple audio mixing
- **[`crossfade-mixing.mts`](crossfade-mixing.mts)** - Crossfading between sources
- **[`stereo-mixer.mts`](stereo-mixer.mts)** - Multi-channel mixing

### Resource Management

- **[`resource-cleanup-basic.mts`](resource-cleanup-basic.mts)** - Manual and automatic cleanup
- **[`resource-management.mts`](resource-management.mts)** - Advanced resource patterns

### Performance and Testing

- **[`monitor-performance.mts`](monitor-performance.mts)** - Performance monitoring
- **[`test-negotiated-formats.mts`](test-negotiated-formats.mts)** - Format negotiation testing
- **[`sample-range-demo.mts`](sample-range-demo.mts)** - Audio sample value demonstrations

## 📋 Prerequisites

- **Node.js 22+** - Required for modern JavaScript features
- **Linux with PipeWire** - PipeWire 0.3+ must be running
- **Audio system** - Working audio output device

## 💡 Tips

- **Start with basics** - Begin with `quick-start.mts` or `getting-started.mts`
- **Check audio** - Ensure your audio system is working before running examples
- **Use headphones** - Some examples generate tones that may be loud
- **Read the code** - Examples are self-documenting with helpful comments

## 🔧 Troubleshooting

If examples don't work:

1. **Check PipeWire** - Ensure PipeWire is running: `systemctl --user status pipewire`
2. **Audio permissions** - Make sure your user can access audio devices
3. **Node.js version** - Verify you're using Node.js 22 or later
4. **Dependencies** - Run `npm install` to ensure all dependencies are installed

## 📚 Learning Path

1. **Start here**: [`quick-start.mts`](quick-start.mts)
2. **Learn cleanup**: [`resource-cleanup-basic.mts`](resource-cleanup-basic.mts)
3. **Generate audio**: [`simple-synthesizer.mts`](simple-synthesizer.mts)
4. **Mix sources**: [`basic-mixing.mts`](basic-mixing.mts)
5. **Advanced topics**: Explore other examples based on your needs

## ⚠️ Generated Files Notice

**These files are automatically generated!**

The examples in this directory are created by the documentation build system from source files in [`.snippets/`](../.snippets/). If you want to:

- **Modify an example** → Edit the corresponding file in [`.snippets/`](../.snippets/)
- **Add a new example** → Create it in [`.snippets/`](../.snippets/) with proper snippet markers
- **Contribute to docs** → See [How to Author Documentation](../docs/how-to-guides/author-documentation.md)

After making changes to `.snippets/`, run `npm run docs:generate` to update the examples.

## 📖 More Resources

- **[Documentation](../docs/)** - Complete guides, tutorials, and API reference
- **[Tutorials](../docs/tutorials/)** - Step-by-step learning experiences
- **[How-to Guides](../docs/how-to-guides/)** - Practical problem-solving guides
- **[API Reference](../docs/reference/)** - Complete technical documentation

---

**🎵 Happy coding with PipeWire!**
