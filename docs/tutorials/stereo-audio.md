# Understanding Stereo Audio

In this tutorial, you'll learn the fundamentals of stereo audio in PipeWire, from basic channel concepts to your first stereo application.

## What You'll Learn

- How stereo channels work in PipeWire
- Sample ordering and interleaving
- Creating your first stereo audio generator
- Understanding the difference between mono and stereo

## Prerequisites

- Complete [Getting Started](getting-started.md) tutorial
- Basic understanding of audio samples

## Why Stereo?

Stereo audio uses two channels (left and right) to create a sense of space and width. This allows for:

- **Spatial positioning** - Sounds can appear to come from different locations
- **Immersive experiences** - More realistic audio reproduction
- **Creative effects** - Panning, stereo width, and spatial effects

## Understanding Channel Interleaving

With stereo audio (`channels: 2`), samples are interleaved - meaning left and right samples alternate:

```
[Left₁, Right₁, Left₂, Right₂, Left₃, Right₃, ...]
```

Your generator function must yield samples in this specific order.

## Step 1: Basic Mono vs Stereo

Let's start by comparing mono and stereo output:

<!-- stereo-tutorial-mono-vs-stereo.mts#mono-setup -->

```typescript
// First, create a mono stream
await using session = await startSession();
await using monoStream = await session.createAudioOutputStream({
  name: "Mono Demo",
  quality: AudioQuality.Standard,
  channels: 1, // Mono - single channel
  role: "Music",
});

await monoStream.connect();

// Simple mono tone generator
function* monoTone(frequency: number, duration: number) {
  const totalSamples = duration * monoStream.rate;
  const cycle = (Math.PI * 2) / monoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    yield Math.sin(i * cycle * frequency) * 0.3;
  }
}

console.log("🎵 Playing mono tone...");
await monoStream.write(monoTone(440, 2.0));
```

Now let's create the same tone in stereo:

<!-- stereo-tutorial-mono-vs-stereo.mts#stereo-setup -->

```typescript
// Create a stereo stream
await using stereoStream = await session.createAudioOutputStream({
  name: "Stereo Demo",
  quality: AudioQuality.Standard,
  channels: 2, // Stereo - two channels
  role: "Music",
});

await stereoStream.connect();

// Stereo tone generator - same signal in both channels
function* stereoTone(frequency: number, duration: number) {
  const totalSamples = duration * stereoStream.rate;
  const cycle = (Math.PI * 2) / stereoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    yield sample; // Left channel
    yield sample; // Right channel (same as left)
  }
}

console.log("🎵 Playing stereo tone (same in both channels)...");
await stereoStream.write(stereoTone(440, 2.0));
```

## Step 2: Creating Channel Independence

Now let's create different audio in each channel:

<!-- stereo-tutorial-independent-channels.mts#independent-channels -->

```typescript
// Generator with different content per channel
function* independentChannels(duration: number) {
  const totalSamples = duration * stereoStream.rate;
  const cycle = (Math.PI * 2) / stereoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    // Left channel: 440Hz (A4)
    const leftSample = Math.sin(i * cycle * 440) * 0.3;

    // Right channel: 660Hz (E5)
    const rightSample = Math.sin(i * cycle * 660) * 0.3;

    yield leftSample; // Left channel
    yield rightSample; // Right channel
  }
}

console.log("🎵 Playing independent channels (Left: 440Hz, Right: 660Hz)...");
console.log("    Use headphones to hear the difference clearly!");
await stereoStream.write(independentChannels(3.0));
```

## Step 3: Your First Stereo Effect

Let's create a simple panning effect where a tone moves from left to right:

<!-- stereo-tutorial-simple-panning.mts#simple-panning -->

```typescript
function* simplePanning(frequency: number, duration: number) {
  const totalSamples = duration * stereoStream.rate;
  const cycle = (Math.PI * 2) / stereoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stereoStream.rate; // Current time in seconds
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Calculate pan position: starts at -1 (left), ends at +1 (right)
    const panPosition = (t / duration) * 2 - 1; // -1 to +1 over duration

    // Simple linear panning (we'll learn better methods later)
    const leftGain = Math.max(0, 1 - (panPosition + 1) / 2); // 1 to 0
    const rightGain = Math.max(0, (panPosition + 1) / 2); // 0 to 1

    yield sample * leftGain; // Left channel
    yield sample * rightGain; // Right channel
  }
}

console.log("🎵 Playing panning tone (moves left to right)...");
await stereoStream.write(simplePanning(523, 4.0)); // C5 note
```

## Step 4: Understanding What You Built

Let's examine what makes this work:

### Sample Ordering

The most important concept is that you must yield samples in the correct order:

<!-- stereo-tutorial-concepts.mts#sample-ordering-correct -->

```typescript
// ✅ Correct: alternating left/right
function* correctStereoOrdering(totalSamples: number) {
  function generateSample(i: number) {
    return Math.sin(i * 0.01) * 0.3; // Simple sine wave
  }

  for (let i = 0; i < totalSamples; i++) {
    const sample = generateSample(i);
    const leftGain = 0.5;
    const rightGain = 0.5;

    yield sample * leftGain; // Left channel first
    yield sample * rightGain; // Right channel second
  }
}
```

<!-- stereo-tutorial-concepts.mts#sample-ordering-explanation -->

```typescript
// ❌ Wrong: grouped by channel
// for (let i = 0; i < totalSamples; i++) {
//   const sample = generateSample(i);
//   leftSamples.push(sample * leftGain);
//   rightSamples.push(sample * rightGain);
// }
// Don't do this - PipeWire expects interleaved samples
```

### Channel Count

When you specify `channels: 2`, PipeWire expects exactly twice as many samples:

<!-- stereo-tutorial-concepts.mts#channel-count-calculation -->

```typescript
const durationSeconds = 2.0;
const sampleRate = 48000;

// Mono (channels: 1)
const monoSampleCount = durationSeconds * sampleRate; // 96,000 samples

// Stereo (channels: 2)
const stereoSampleCount = durationSeconds * sampleRate * 2; // 192,000 samples
//                                                       ↑
//                                              Must yield 2x as many!

console.log(`Mono samples needed: ${monoSampleCount}`);
console.log(`Stereo samples needed: ${stereoSampleCount}`);
```

## Complete Example

Here's a complete stereo audio application that demonstrates the concepts:

<!-- stereo-tutorial-complete-demo.mts#stereo-concepts-demo -->

```typescript
await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Stereo Learning Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Demonstration generator that shows multiple concepts
function* stereoDemo() {
  const sampleRate = stream.rate;
  const cycleFactor = (Math.PI * 2) / sampleRate;

  // 1. Same tone in both channels (2 seconds)
  console.log("1. Same tone in both channels...");
  for (let i = 0; i < sampleRate * 2; i++) {
    const sample = Math.sin(i * cycleFactor * 440) * 0.3;
    yield sample; // Left
    yield sample; // Right
  }

  // 2. Different tones per channel (2 seconds)
  console.log("2. Different tones per channel...");
  for (let i = 0; i < sampleRate * 2; i++) {
    const leftSample = Math.sin(i * cycleFactor * 440) * 0.3; // A4
    const rightSample = Math.sin(i * cycleFactor * 523) * 0.3; // C5
    yield leftSample;
    yield rightSample;
  }

  // 3. Simple panning effect (3 seconds)
  console.log("3. Panning effect...");
  const panDuration = 3;
  for (let i = 0; i < sampleRate * panDuration; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(i * cycleFactor * 660) * 0.3; // E5

    // Pan from left to right
    const panPos = (t / panDuration) * 2 - 1; // -1 to +1
    const leftGain = Math.max(0, 1 - (panPos + 1) / 2);
    const rightGain = Math.max(0, (panPos + 1) / 2);

    yield sample * leftGain;
    yield sample * rightGain;
  }
}

await stream.write(stereoDemo());
console.log("✨ Stereo demo complete!");
```

## What You've Learned

- **Stereo basics**: Two channels create spatial audio experiences
- **Sample interleaving**: Left and right samples must alternate
- **Channel independence**: Each channel can have different audio content
- **Simple panning**: Moving audio between left and right channels
- **Sample counting**: Stereo requires exactly 2x the samples of mono

## Key Takeaways

1. **Always interleave**: `[L, R, L, R, ...]` never `[L, L, ...], [R, R, ...]`
2. **Sample math**: Stereo duration × sample rate × 2 channels = total samples
3. **Test with headphones**: Stereo effects are clearest with headphones
4. **Start simple**: Master basic concepts before advanced effects

## Next Steps

Now that you understand stereo fundamentals, you can explore advanced techniques:

- **[Create Stereo Audio Effects](../how-to-guides/create-stereo-effects.md)** - Learn professional stereo effects like panning, binaural beats, and spatial audio
- **[Mix Multiple Audio Sources](../how-to-guides/mix-audio-sources.md)** - Combine multiple stereo streams
- **[Choose Audio Quality](../how-to-guides/choose-audio-quality.md)** - Optimize quality settings for stereo applications

The foundation you've built here will serve you well for any stereo audio work!
