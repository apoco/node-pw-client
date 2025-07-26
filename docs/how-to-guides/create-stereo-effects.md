# Create Stereo Audio Effects

This guide shows you how to implement various stereo audio effects including panning, binaural beats, and spatial processing techniques.

> **📁 Complete Examples**: See [`examples/`](../../examples/) for stereo effect demonstrations
>
> ```bash
> npx tsx examples/stereo-panning-effects.mts
> npx tsx examples/binaural-beats.mts
> npx tsx examples/haas-effect.mts
> ```

## Quick Start

Stereo audio in PipeWire uses interleaved samples: `[Left₁, Right₁, Left₂, Right₂, ...]`

```typescript
import { startSession, AudioQuality } from "pw-client";

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Stereo Effects",
  quality: AudioQuality.Standard,
  channels: 2, // Stereo
  role: "Music",
});

await stream.connect();
```

## Basic Stereo Generator

Create independent audio for each channel:

<!-- noise.mts#stereo-noise-generator -->

```typescript
function* generateStereoNoise(
  durationSeconds: number,
  sampleRate: number,
  volume = 0.5
) {
  const totalSamples = durationSeconds * sampleRate * 2; // 2 channels

  for (let i = 0; i < totalSamples; i += 2) {
    // Generate independent random noise for each channel
    for (let ch = 0; ch < 2; ch++) {
      const sample = (Math.random() - 0.5) * volume;
      yield sample;
    }
  }
}
```

## Panning Effects

Panning positions mono audio in the stereo field. There are two main approaches with different trade-offs.

### Panning Algorithms

First, let's define the two main panning algorithms. In audio engineering, these are called **panning laws** - mathematical formulas that determine how audio signals are distributed between left and right channels:

**Linear Panning** (simpler but flawed):

<!-- stereo-panning-effects.mts#linear-pan-function -->

```typescript
// Linear panning law (simpler but flawed)
function linearPan(sample: number, panPosition: number): [number, number] {
  // panPosition: -1 = full left, 0 = center, +1 = full right
  const normalizedPan = (panPosition + 1) / 2; // Convert to 0-1 range
  const leftGain = 1 - normalizedPan;
  const rightGain = normalizedPan;

  return [sample * leftGain, sample * rightGain];
}
```

- Simple linear interpolation between left/right
- Causes ~30% volume drop at center position
- Easier to understand but not perceptually accurate

**Constant Power Panning** (recommended):

<!-- stereo-panning-effects.mts#constant-power-pan-function -->

```typescript
// Constant power panning law (recommended)
function constantPowerPan(
  sample: number,
  panPosition: number
): [number, number] {
  // panPosition: -1 = full left, 0 = center, +1 = full right
  const normalizedPan = (panPosition + 1) / 2; // Convert to 0-1 range
  const angle = (normalizedPan * Math.PI) / 2; // 0 to π/2

  const leftGain = Math.cos(angle);
  const rightGain = Math.sin(angle);

  return [sample * leftGain, sample * rightGain];
}
```

- Uses trigonometric functions (sine/cosine)
- Maintains consistent perceived volume at all pan positions
- Industry standard for professional audio
- No volume dip when panning through center

### Static Pan Position

Position audio at a fixed location:

```typescript
function* pannedTone(frequency: number, duration: number, panPosition: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const sample = Math.sin(i * cycle * frequency) * 0.3;
    const [left, right] = constantPowerPan(sample, panPosition);

    yield left;
    yield right;
  }
}

// Play tone panned 75% to the right
await stream.write(pannedTone(440, 2.0, 0.75));
```

### Oscillating Pan Position

Create movement by changing the pan position over time:

<!-- stereo-panning-effects.mts#oscillating-panning -->

```typescript
// Oscillating pan position example
function* oscillatingPan(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Oscillating pan position from left to right
    const panPosition = Math.sin(t * 0.5); // Slow oscillation

    const [left, right] = constantPowerPan(sample, panPosition);

    yield left;
    yield right;
  }
}

console.log("🎵 Playing oscillating pan (3 seconds)...");
await stream.write(oscillatingPan(523, 3.0)); // C5 note
await setTimeout(500);
```

### Static Pan Position

Position audio at a fixed location:

<!-- stereo-panning-effects.mts#static-panning -->

```typescript
// Static pan position example
function* pannedTone(frequency: number, duration: number, panPosition: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const sample = Math.sin(i * cycle * frequency) * 0.3;
    const [left, right] = constantPowerPan(sample, panPosition);

    yield left;
    yield right;
  }
}

console.log("🎵 Playing tone panned 75% to the right (2 seconds)...");
await stream.write(pannedTone(440, 2.0, 0.75));
```

### Comparing Panning Algorithms

Hear the difference between linear and constant power panning:

<!-- stereo-panning-effects.mts#panning-comparison -->

```typescript
function* linearPanningDemo(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Oscillating pan position
    const panPos = Math.sin(t * 2); // -1 to +1

    // Use linear panning
    const [leftSample, rightSample] = linearPan(sample, panPos);

    yield leftSample;
    yield rightSample;
  }
}

function* constantPowerPanningDemo(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Oscillating pan position
    const panPos = Math.sin(t * 2); // -1 to +1

    // Use constant power panning
    const [leftSample, rightSample] = constantPowerPan(sample, panPos);

    yield leftSample;
    yield rightSample;
  }
}

console.log("🎵 Playing linear panning (notice volume dip in center)...");
await stream.write(linearPanningDemo(523, 3.0));

await setTimeout(500);

console.log("🎵 Playing constant power panning (consistent volume)...");
await stream.write(constantPowerPanningDemo(523, 3.0));
```

## Psychoacoustic Effects

### Binaural Beats

Create beats by playing slightly different frequencies in each ear:

<!-- binaural-beats.mts#binaural-beats-demo -->

```typescript
console.log("🧠 Binaural Beats Demo");

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Binaural Beats Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Binaural beats effect (slightly different frequencies in each ear)
function* binauralBeats(baseFreq: number, beatFreq: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const leftFreq = baseFreq;
    const rightFreq = baseFreq + beatFreq; // Creates beating effect

    const leftSample = Math.sin(i * cycle * leftFreq) * 0.2;
    const rightSample = Math.sin(i * cycle * rightFreq) * 0.2;

    yield leftSample; // Left channel
    yield rightSample; // Right channel
  }
}

console.log("🎵 Playing binaural beats (8Hz beat frequency, 4 seconds)...");
console.log("    Use headphones for best effect!");
await stream.write(binauralBeats(200, 8, 4.0));
```

### Haas Effect (Precedence Effect)

Create stereo width using short delays. **Stereo width** refers to how spread out or spacious the audio sounds - wider stereo makes audio feel like it extends further beyond the speakers/headphones:

<!-- haas-effect.mts#haas-effect-demo -->

```typescript
console.log("⏱️ Haas Effect (Precedence Effect) Demo");

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Haas Effect Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Haas effect (short delay for stereo width)
function* haasEffect(frequency: number, duration: number, delayMs = 15) {
  const totalSamples = duration * stream.rate;
  const delaySamples = Math.floor((delayMs / 1000) * stream.rate);
  const cycle = (Math.PI * 2) / stream.rate;

  // Buffer for delay
  const delayBuffer = new Array<number>(delaySamples).fill(0);
  let bufferIndex = 0;

  for (let i = 0; i < totalSamples; i++) {
    const currentSample = Math.sin(i * cycle * frequency) * 0.3;

    // Left channel: direct signal
    const leftSample = currentSample;

    // Right channel: delayed signal
    const rightSample = delayBuffer[bufferIndex];
    delayBuffer[bufferIndex] = currentSample;
    bufferIndex = (bufferIndex + 1) % delaySamples;

    yield leftSample;
    yield rightSample;
  }
}

console.log("🎵 Playing Haas effect with 15ms delay (4 seconds)...");
console.log("    Creates stereo width without affecting localization");
await stream.write(haasEffect(330, 4.0, 15));
```

## Advanced Techniques

### Mid/Side Processing

Control stereo width by processing the Mid (mono) and Side (stereo) components separately:

<!-- mid-side-processing.mts#mid-side-processing-demo -->

```typescript
console.log("🔄 Mid/Side Processing Demo");

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Mid/Side Processing Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Mid/Side encoding: convert L/R to M/S
function encodeMS(left: number, right: number): [number, number] {
  const mid = (left + right) / 2; // Sum (mono content)
  const side = (left - right) / 2; // Difference (stereo content)
  return [mid, side];
}

// Mid/Side decoding: convert M/S back to L/R
function decodeMS(mid: number, side: number): [number, number] {
  const left = mid + side;
  const right = mid - side;
  return [left, right];
}

function* midSideProcessing(
  frequency: number,
  duration: number,
  stereoWidth = 1.0
) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;

    // Create initial stereo signal
    const baseSignal = Math.sin(i * cycle * frequency) * 0.3;
    const modulation = Math.sin(t * 4) * 0.1; // Slow modulation

    let left = baseSignal + modulation;
    let right = baseSignal - modulation;

    // Encode to Mid/Side
    const [mid, sideSignal] = encodeMS(left, right);

    // Process: adjust stereo width by scaling the Side signal
    const side = sideSignal * stereoWidth;

    // Decode back to L/R
    [left, right] = decodeMS(mid, side);

    yield left;
    yield right;
  }
}

console.log("🎵 Normal stereo width (2 seconds)...");
await stream.write(midSideProcessing(349, 2.0, 1.0)); // F4
await setTimeout(300);

console.log("🎵 Wide stereo effect (2 seconds)...");
await stream.write(midSideProcessing(349, 2.0, 2.0)); // Enhanced width
await setTimeout(300);

console.log("🎵 Narrow stereo - more mono (2 seconds)...");
await stream.write(midSideProcessing(349, 2.0, 0.3)); // Reduced width
```

### Custom Delay Effects

Create stereo delay effects with different delay times for each channel:

<!-- stereo-effects.mts#stereo-delay-effects -->

```typescript
console.log("🔄 Stereo Delay Effects Demo");

// Create stereo delay effects with different delay times for each channel
function* stereoDelay(
  input: Iterable<number>,
  leftDelayMs: number,
  rightDelayMs: number,
  feedback = 0.3,
  wet = 0.5
) {
  const leftDelaySamples = Math.floor((leftDelayMs / 1000) * stream.rate);
  const rightDelaySamples = Math.floor((rightDelayMs / 1000) * stream.rate);

  const leftBuffer = new Array<number>(leftDelaySamples).fill(0);
  const rightBuffer = new Array<number>(rightDelaySamples).fill(0);

  let leftIndex = 0;
  let rightIndex = 0;
  let isLeft = true;

  for (const sample of input) {
    if (isLeft) {
      // Process left channel
      const delayed = leftBuffer[leftIndex];
      const output = sample * (1 - wet) + delayed * wet;

      leftBuffer[leftIndex] = sample + delayed * feedback;
      leftIndex = (leftIndex + 1) % leftDelaySamples;

      yield output;
    } else {
      // Process right channel
      const delayed = rightBuffer[rightIndex];
      const output = sample * (1 - wet) + delayed * wet;

      rightBuffer[rightIndex] = sample + delayed * feedback;
      rightIndex = (rightIndex + 1) % rightDelaySamples;

      yield output;
    }

    isLeft = !isLeft;
  }
}

// Apply stereo delay to a tone
function* sourceTone(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate * 2; // Stereo
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i += 2) {
    const sample = Math.sin((i / 2) * cycle * frequency) * 0.3;
    yield sample; // Left
    yield sample; // Right
  }
}

console.log("🎵 Playing stereo delay effect...");
await stream.write(
  stereoDelay(
    sourceTone(440, 3.0),
    250, // Left delay: 250ms
    380, // Right delay: 380ms
    0.4, // Feedback
    0.6 // Wet mix
  )
);
```

## Common Use Cases

### Spatial Audio for Games

Position sounds in 3D space:

<!-- stereo-effects.mts#spatial-audio-games -->

```typescript
console.log("🎮 Spatial Audio for Games Demo");

// Position sounds in 3D space
function spatialPan(
  sample: number,
  listenerX: number,
  listenerY: number,
  sourceX: number,
  sourceY: number
): [number, number] {
  // Calculate relative position
  const deltaX = sourceX - listenerX;
  const deltaY = sourceY - listenerY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Calculate pan based on horizontal position
  const panPosition = Math.max(-1, Math.min(1, deltaX / 10)); // Normalize to -1..1

  // Apply distance attenuation
  const attenuation = 1 / (1 + distance * 0.1);
  const attenuatedSample = sample * attenuation;

  return constantPowerPan(attenuatedSample, panPosition);
}

// Demonstrate spatial audio by moving a sound source around the listener
function* spatialAudioDemo(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  // Listener is at origin (0, 0)
  const listenerX = 0;
  const listenerY = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Source moves in a circle around the listener
    const radius = 5;
    const sourceX = Math.cos(t * 2) * radius; // Move in X
    const sourceY = Math.sin(t * 2) * radius; // Move in Y

    const [leftSample, rightSample] = spatialPan(
      sample,
      listenerX,
      listenerY,
      sourceX,
      sourceY
    );

    yield leftSample;
    yield rightSample;
  }
}

console.log("🎵 Playing spatial audio demo (sound moving in circle)...");
await stream.write(spatialAudioDemo(440, 4.0));
```

## Best Practices

- **Use headphones for testing** - Stereo effects are more apparent with headphones
- **Keep volumes reasonable** - Stereo effects can increase perceived loudness
- **Consider mono compatibility** - Test how effects sound when summed to mono
- **Avoid very short delays** - Delays < 5ms can cause comb filtering
- **Balance stereo width** - Too much width can make audio feel disconnected

## Troubleshooting

### Audio plays in one channel only

Check sample ordering:

```typescript
// ❌ Wrong: not interleaved
yield leftSample;
yield leftSample;
yield rightSample;
yield rightSample;

// ✅ Correct: interleaved L/R pairs
yield leftSample;
yield rightSample;
yield leftSample;
yield rightSample;
```

### Effect not audible

- Verify you're using stereo output (`channels: 2`)
- Test with headphones to isolate channels
- Check that pan calculations are working correctly
- Ensure delay buffers are the right size

### Performance issues

- Use `AudioQuality.Standard` for good performance balance
- Minimize delay buffer sizes when possible
- Consider using `Int16` formats for efficiency in real-time effects

## Related Guides

- **[Choose Audio Quality](choose-audio-quality.md)** - Optimize quality for stereo applications
- **[Mix Audio Sources](mix-audio-sources.md)** - Combine multiple stereo streams
- **[Monitor Performance](monitor-performance.md)** - Track stereo effect performance
