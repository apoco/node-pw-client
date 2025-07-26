# Getting Started with PipeWire Audio

Welcome! This tutorial will guide you through creating your first PipeWire audio application. By the end, you'll have a working program that plays a simple tone through your speakers.

## What You'll Learn

- How to set up a PipeWire session
- How to create and connect an audio output stream
- How to generate and play audio samples
- How to properly clean up resources

> **💡 Try the Complete Example**: All code in this tutorial is available as a runnable example at [`examples/getting-started.mts`](../../examples/getting-started.mts). You can run it with:
>
> ```bash
> npx tsx examples/getting-started.mts
> ```

## Prerequisites

Before starting, make sure you have:

- A Linux system
- PipeWire installed and running
- Node.js 22+
- A code editor
- Basic knowledge of JavaScript/TypeScript

## Step 1: Project Setup

Create a new directory for your project:

```bash
mkdir my-audio-app
cd my-audio-app
npm init -y
```

Install the PipeWire client library:

```bash
npm install pw-client
```

Update `package.json` so ES modules are enabled, and create a `start` script:

```json
{
  "type": "module",
  "scripts": {
    "start": "node index.mjs"
  }
}
```

## Step 2: Your First Audio Program

Create `index.mjs` with the following code:

<!-- getting-started.mts#complete-example -->

```typescript
import { startSession, AudioQuality } from "pw-client";

async function playTone() {
  // Create a PipeWire session
  const session = await startSession();

  try {
    console.log("✅ Connected to PipeWire");

    // Create an audio output stream
    const stream = await session.createAudioOutputStream({
      name: "My First Audio App", // Friendly name for PipeWire
      quality: AudioQuality.Standard, // Good balance of quality/performance
      channels: 2, // Stereo output
    });

    try {
      // Connect to the audio system
      await stream.connect();
      console.log(
        `🔊 Stream connected: ${stream.format.description} @ ${stream.rate}Hz`
      );

      // Generate a simple tone
      function* generateTone(frequency: number, duration: number) {
        const totalSamples = Math.floor(
          duration * stream.rate * stream.channels
        );
        const cycle = (Math.PI * 2) / stream.rate;
        let phase = 0;

        for (let i = 0; i < totalSamples; i += stream.channels) {
          // Create the sine wave sample (range: -1.0 to +1.0)
          const sample = Math.sin(phase * frequency) * 0.2; // 20% volume

          // Output to both stereo channels
          yield sample; // Left channel
          yield sample; // Right channel

          phase += cycle;
        }
      }

      // Play the tone
      console.log("🎵 Playing 440Hz tone for 2 seconds...");
      await stream.write(generateTone(440, 2.0)); // A4 note for 2 seconds

      console.log("✨ Done!");
    } finally {
      // Clean up the stream
      await stream.dispose();
    }
  } finally {
    // Clean up the session
    await session.dispose();
  }
}

// Run the program
playTone().catch(console.error);
```

## Step 3: Run Your Program

```bash
node index.mjs
```

You should hear a 2-second pure tone at 440Hz (the musical note A4)!

## What Just Happened?

Let's break down the key concepts:

### 1. Session Management

<!-- getting-started.mts#session-management -->

```typescript
  // Create a PipeWire session
  const session = await startSession();

  try {
    console.log("✅ Connected to PipeWire");
```

- Creates a connection to the PipeWire audio system
- Sessions manage all your audio streams
- Must be cleaned up with `await session.dispose()`

### 2. Stream Creation

<!-- getting-started.mts#stream-creation -->

```typescript
    // Create an audio output stream
    const stream = await session.createAudioOutputStream({
      name: "My First Audio App", // Friendly name for PipeWire
      quality: AudioQuality.Standard, // Good balance of quality/performance
      channels: 2, // Stereo output
    });

    try {
      // Connect to the audio system
      await stream.connect();
      console.log(
        `🔊 Stream connected: ${stream.format.description} @ ${stream.rate}Hz`
      );
```

- Creates an audio output stream with specified properties
- `quality` determines the technical audio format automatically
- `channels: 2` means stereo output

### 3. Audio Generation

<!-- getting-started.mts#audio-generation -->

```typescript
      // Generate a simple tone
      function* generateTone(frequency: number, duration: number) {
        const totalSamples = Math.floor(
          duration * stream.rate * stream.channels
        );
        const cycle = (Math.PI * 2) / stream.rate;
        let phase = 0;

        for (let i = 0; i < totalSamples; i += stream.channels) {
          // Create the sine wave sample (range: -1.0 to +1.0)
          const sample = Math.sin(phase * frequency) * 0.2; // 20% volume

          // Output to both stereo channels
          yield sample; // Left channel
          yield sample; // Right channel

          phase += cycle;
        }
      }

      // Play the tone
      console.log("🎵 Playing 440Hz tone for 2 seconds...");
      await stream.write(generateTone(440, 2.0)); // A4 note for 2 seconds

      console.log("✨ Done!");
```

- Generator functions provide memory-efficient audio streaming
- Samples are always floating-point numbers from -1.0 to +1.0
- For stereo, yield one sample per channel in sequence

### 4. Resource Cleanup

<!-- getting-started.mts#resource-cleanup -->

```typescript
    } finally {
      // Clean up the stream
      await stream.dispose();
    }
  } finally {
    // Clean up the session
    await session.dispose();
  }
```

- Always clean up streams and sessions to prevent resource leaks
- Use `try/finally` blocks to ensure cleanup happens even if errors occur
- For easier cleanup options with Node.js 24+, see [Resource Management](../explanation/resource-management.md)

## Next Steps

Congratulations! You've created your first PipeWire audio application. Here's what to explore next:

- **[Building a Simple Synthesizer](simple-synthesizer.md)** - Create more complex sounds
- **[Working with Stereo Audio](stereo-audio.md)** - Advanced multi-channel programming
- **[Choose the Right Audio Quality](../how-to-guides/choose-audio-quality.md)** - Optimize for your use case

## Troubleshooting

**No sound?**

- Check that PipeWire is running: `systemctl --user status pipewire`
- Verify audio output: `pactl list short sinks`
- Try a different quality level: `AudioQuality.High` or `AudioQuality.Efficient`

**Build errors?**

- Install PipeWire development headers: `sudo apt install libpipewire-0.3-dev`
- Make sure you have build tools: `sudo apt install build-essential`

**Need help?** Check the [API Reference](../reference/api/) or [How-to Guides](../how-to-guides/) for more detailed information.
