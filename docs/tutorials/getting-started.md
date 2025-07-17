# Getting Started with PipeWire Audio

Welcome! This tutorial will guide you through creating your first PipeWire audio application. By the end, you'll have a working program that plays a simple tone through your speakers.

## Node.js Version Compatibility

This tutorial shows manual cleanup patterns compatible with **Node.js 22 LTS**. If you're using **Node.js 24+**, you can use the shorter `await using` syntax instead:

```javascript
// Node.js 24+ (automatic cleanup)
await using session = await startSession();
await using stream = await session.createAudioOutputStream(options);
// Resources automatically cleaned up

// Node.js 22 LTS (manual cleanup - shown in examples below)
const session = await startSession();
try {
  const stream = await session.createAudioOutputStream(options);
  try {
    // Use stream...
  } finally {
    await stream.dispose();
  }
} finally {
  await session.dispose();
}
```

## What You'll Learn

- How to set up a PipeWire session
- How to create and connect an audio output stream
- How to generate and play audio samples
- How to properly clean up resources

## Prerequisites

Before starting, make sure you have:

- Linux system with PipeWire installed and running
- Node.js 22+ installed
- Basic knowledge of JavaScript/TypeScript
- A code editor (VS Code recommended)

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

Update `package.json` so ES modules are enabled:

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

```javascript
import { startSession, AudioQuality } from "pw-client";

// Main function to keep things organized
async function playTone() {
  // Step 1: Create a PipeWire session
  // For Node.js 24+ (with explicit resource management):
  // await using session = await startSession();

  // For Node.js 22 LTS (manual cleanup):
  const session = await startSession();

  try {
    console.log("✅ Connected to PipeWire");

    // Step 2: Create an audio output stream
    // For Node.js 24+ (with explicit resource management):
    // await using stream = await session.createAudioOutputStream({

    // For Node.js 22 LTS (manual cleanup):
    const stream = await session.createAudioOutputStream({
      name: "My First Audio App", // Friendly name for PipeWire
      quality: AudioQuality.Standard, // Good balance of quality/performance
      channels: 2, // Stereo output
    });

    try {
      // Step 3: Connect to the audio system
      await stream.connect();
      console.log(
        `🔊 Stream connected: ${stream.format.description} @ ${stream.rate}Hz`
      );

      // Step 4: Generate a simple tone
      function* generateTone(frequency, duration) {
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

      // Step 5: Play the tone
      console.log("🎵 Playing 440Hz tone for 2 seconds...");
      await stream.write(generateTone(440, 2.0)); // A4 note for 2 seconds

      console.log("✨ Done!");
    } finally {
      // Clean up the stream (required for Node.js 22)
      await stream.dispose();
    }
  } finally {
    // Clean up the session (required for Node.js 22)
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

```javascript
await using session = await startSession();
```

- Creates a connection to the PipeWire audio system
- `await using` ensures automatic cleanup when the block exits
- Sessions manage all your audio streams

### 2. Stream Creation

```javascript
await using stream = await session.createAudioOutputStream({
  name: "My First Audio App",
  quality: AudioQuality.Standard,
  channels: 2,
});
```

- Creates an audio output stream with specified properties
- `quality` determines the technical audio format automatically
- `channels: 2` means stereo output

### 3. Audio Generation

```javascript
function* generateTone(frequency, duration) {
  // Generator function yields samples one by one
  const sample = Math.sin(phase * frequency) * 0.2;
  yield sample; // Always between -1.0 and +1.0
}
```

- Generator functions provide memory-efficient audio streaming
- Samples are always floating-point numbers from -1.0 to +1.0
- For stereo, yield one sample per channel in sequence

### 4. Resource Cleanup

```javascript
await using stream = // ...
```

- `await using` automatically closes streams and sessions
- No manual cleanup needed - prevents resource leaks
- Modern JavaScript resource management

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

**Need help?** Check the [API Reference](../reference/api.md) or [How-to Guides](../how-to-guides/) for more detailed information.
