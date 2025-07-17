# Working with Stereo Audio

In this tutorial, you'll learn how to create spatial audio effects using stereo channels. We'll explore panning, stereo separation, and create immersive audio experiences.

## What You'll Learn

- How stereo audio works in PipeWire
- Channel ordering and sample interleaving
- Creating panning effects
- Building stereo-specific generators
- Spatial audio techniques

## Prerequisites

- Complete [Getting Started](getting-started.md) and [Simple Synthesizer](simple-synthesizer.md) tutorials
- Understanding of stereo audio concepts
- Basic knowledge of trigonometry (for circular panning)

## Understanding Stereo in PipeWire

With stereo audio (`channels: 2`), samples are interleaved:

```
[Left₁, Right₁, Left₂, Right₂, Left₃, Right₃, ...]
```

Your generator function should yield samples in this order:

```javascript
for (let i = 0; i < totalSamples; i += channels) {
  yield leftSample;   // Left channel
  yield rightSample;  // Right channel
}
```

## Step 1: Basic Stereo Generator

Create `stereo-demo.mjs`:

```javascript
import { startSession, AudioQuality } from "pw-client";

class StereoAudio {
  constructor(stream) {
    this.stream = stream;
    this.sampleRate = stream.rate;
    this.channels = stream.channels;

    if (this.channels !== 2) {
      throw new Error("This demo requires stereo output (2 channels)");
    }
  }

  // Basic stereo tone with different frequencies per channel
  *stereoTone(leftFreq, rightFreq, duration, volume = 0.3) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const cycle = (Math.PI * 2) / this.sampleRate;
    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      // Generate different tones for each channel
      const leftSample = Math.sin(phase * leftFreq) * volume;
      const rightSample = Math.sin(phase * rightFreq) * volume;

      yield leftSample; // Left channel
      yield rightSample; // Right channel

      phase += cycle;
    }
  }

  // Panning effect: move a mono signal between left and right
  *panningTone(frequency, duration, volume = 0.3) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const cycle = (Math.PI * 2) / this.sampleRate;
    const panCycle = (Math.PI * 2) / (duration * this.sampleRate); // Full pan cycle over duration
    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      // Generate the base signal
      const signal = Math.sin(phase * frequency) * volume;

      // Calculate panning position (-1 = full left, +1 = full right)
      const panPosition = Math.sin(phase * 0.5); // Slow panning

      // Convert pan position to left/right gains
      const leftGain = (1 - panPosition) * 0.5; // 0 to 1
      const rightGain = (1 + panPosition) * 0.5; // 0 to 1

      yield signal * leftGain; // Left channel
      yield signal * rightGain; // Right channel

      phase += cycle;
    }
  }

  // Circular panning: signal moves in a circle around the listener
  *circularPan(frequency, duration, panSpeed = 1.0, volume = 0.3) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const cycle = (Math.PI * 2) / this.sampleRate;
    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      // Generate the base signal
      const signal = Math.sin(phase * frequency) * volume;

      // Calculate circular pan position
      const panAngle = (phase * panSpeed) % (Math.PI * 2);

      // Convert angle to stereo position (simplified model)
      const leftGain = (Math.cos(panAngle) + 1) * 0.5; // 0 to 1
      const rightGain = (Math.sin(panAngle) + 1) * 0.5; // 0 to 1

      yield signal * leftGain; // Left channel
      yield signal * rightGain; // Right channel

      phase += cycle;
    }
  }

  // Stereo delay effect: right channel is delayed version of left
  *stereoDelay(frequency, duration, delayMs = 50, volume = 0.3) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const delaySamples = Math.floor((delayMs / 1000) * this.sampleRate);
    const cycle = (Math.PI * 2) / this.sampleRate;

    // Buffer to store delayed samples
    const delayBuffer = new Array(delaySamples).fill(0);
    let bufferIndex = 0;
    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      // Generate the signal
      const signal = Math.sin(phase * frequency) * volume;

      // Get delayed sample from buffer
      const delayedSignal = delayBuffer[bufferIndex];

      // Store current sample in delay buffer
      delayBuffer[bufferIndex] = signal;
      bufferIndex = (bufferIndex + 1) % delaySamples;

      yield signal; // Left channel (original)
      yield delayedSignal; // Right channel (delayed)

      phase += cycle;
    }
  }

  // Stereo width control: adjust stereo separation
  *stereoWidth(leftFreq, rightFreq, duration, width = 1.0, volume = 0.3) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const cycle = (Math.PI * 2) / this.sampleRate;
    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      // Generate stereo signals
      const leftSignal = Math.sin(phase * leftFreq) * volume;
      const rightSignal = Math.sin(phase * rightFreq) * volume;

      // Calculate mid (mono) and side (stereo) components
      const mid = (leftSignal + rightSignal) * 0.5;
      const side = (leftSignal - rightSignal) * 0.5;

      // Apply width control and reconstruct stereo
      const leftOutput = mid + side * width;
      const rightOutput = mid - side * width;

      yield leftOutput; // Left channel
      yield rightOutput; // Right channel

      phase += cycle;
    }
  }

  // Helper: Add silence
  async addSilence(duration) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);

    function* silence() {
      for (let i = 0; i < totalSamples; i++) {
        yield 0.0;
      }
    }

    await this.stream.write(silence());
  }
}

// Demo program
async function stereoDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Stereo Audio Demo",
      quality: AudioQuality.Standard,
      channels: 2, // Important: stereo output
    });

    try {
      await stream.connect();
      console.log(
        `🔊 Stereo demo ready: ${stream.format.description} @ ${stream.rate}Hz`
      );

      const stereo = new StereoAudio(stream);

      // Demo 1: Different frequencies in each channel
      console.log("🎵 Demo 1: Left=440Hz, Right=880Hz");
      await stream.write(stereo.stereoTone(440, 880, 3.0));
      await stereo.addSilence(1.0);

      // Demo 2: Panning effect
      console.log("🎵 Demo 2: Panning effect");
      await stream.write(stereo.panningTone(523, 4.0)); // C5 note
      await stereo.addSilence(1.0);

      // Demo 3: Circular panning
      console.log("🎵 Demo 3: Circular panning");
      await stream.write(stereo.circularPan(659, 5.0, 0.8)); // E5 note
      await stereo.addSilence(1.0);

      // Demo 4: Stereo delay
      console.log("🎵 Demo 4: Stereo delay (50ms)");
      await stream.write(stereo.stereoDelay(392, 3.0, 50)); // G4 note
      await stereo.addSilence(1.0);

      // Demo 5: Stereo width control
      console.log("🎵 Demo 5: Stereo width - Normal → Wide → Narrow → Mono");
      await stream.write(stereo.stereoWidth(440, 554, 2.0, 1.0)); // Normal
      await stream.write(stereo.stereoWidth(440, 554, 2.0, 2.0)); // Wide
      await stream.write(stereo.stereoWidth(440, 554, 2.0, 0.5)); // Narrow
      await stream.write(stereo.stereoWidth(440, 554, 2.0, 0.0)); // Mono

      console.log("✨ Stereo demo complete!");
    } finally {
      await stream.dispose(); // Clean up the stream
    }
  } finally {
    await session.dispose(); // Clean up the session
  }
}

stereoDemo().catch(console.error);
```

## Step 2: Advanced Stereo Effects

Create `advanced-stereo.mjs` with more sophisticated effects:

```javascript
import { startSession, AudioQuality } from "pw-client";

class AdvancedStereo {
  constructor(stream) {
    this.stream = stream;
    this.sampleRate = stream.rate;
    this.channels = stream.channels;
  }

  // Generate silence for a specified duration
  *addSilence(duration) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    for (let i = 0; i < totalSamples; i++) {
      yield 0;
    }
  }

  // Binaural beats: slightly different frequencies create beating effect
  *binauralBeats(baseFreq, beatFreq = 4, duration, volume = 0.2) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const cycle = (Math.PI * 2) / this.sampleRate;
    let phase = 0;

    // Left ear gets base frequency
    // Right ear gets base + beat frequency
    const leftFreq = baseFreq;
    const rightFreq = baseFreq + beatFreq;

    for (let i = 0; i < totalSamples; i += this.channels) {
      const leftSample = Math.sin(phase * leftFreq) * volume;
      const rightSample = Math.sin(phase * rightFreq) * volume;

      yield leftSample; // Left channel
      yield rightSample; // Right channel

      phase += cycle;
    }
  }

  // Haas effect: psychoacoustic stereo widening
  *haasEffect(frequency, duration, delayMs = 15, volume = 0.3) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const delaySamples = Math.floor((delayMs / 1000) * this.sampleRate);
    const cycle = (Math.PI * 2) / this.sampleRate;

    const delayBuffer = new Array(delaySamples).fill(0);
    let bufferIndex = 0;
    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      const signal = Math.sin(phase * frequency) * volume;

      // Get delayed sample
      const delayedSignal = delayBuffer[bufferIndex] * 0.8; // Slightly quieter

      // Store current sample
      delayBuffer[bufferIndex] = signal;
      bufferIndex = (bufferIndex + 1) % delaySamples;

      yield signal; // Left channel (original)
      yield delayedSignal; // Right channel (delayed + attenuated)

      phase += cycle;
    }
  }

  // Stereo chorus: multiple delayed versions create rich sound
  *stereoChorus(frequency, duration, volume = 0.3) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const cycle = (Math.PI * 2) / this.sampleRate;

    // Multiple delay lines for chorus effect
    const delays = [
      { samples: Math.floor(0.02 * this.sampleRate), gain: 0.7 }, // 20ms
      { samples: Math.floor(0.035 * this.sampleRate), gain: 0.5 }, // 35ms
      { samples: Math.floor(0.055 * this.sampleRate), gain: 0.3 }, // 55ms
    ];

    // Initialize delay buffers
    const delayBuffers = delays.map((d) => ({
      buffer: new Array(d.samples).fill(0),
      index: 0,
      gain: d.gain,
    }));

    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      const signal = Math.sin(phase * frequency) * volume;

      let leftOutput = signal;
      let rightOutput = signal;

      // Add delayed versions
      delayBuffers.forEach((delay, idx) => {
        const delayedSignal = delay.buffer[delay.index] * delay.gain;

        if (idx % 2 === 0) {
          leftOutput += delayedSignal;
        } else {
          rightOutput += delayedSignal;
        }

        // Store current sample and advance index
        delay.buffer[delay.index] = signal;
        delay.index = (delay.index + 1) % delay.buffer.length;
      });

      yield leftOutput; // Left channel
      yield rightOutput; // Right channel

      phase += cycle;
    }
  }

  // Auto-panning with configurable pattern
  *autoPan(
    frequency,
    duration,
    panRate = 1.0,
    panShape = "sine",
    volume = 0.3
  ) {
    const totalSamples = Math.floor(duration * this.sampleRate * this.channels);
    const cycle = (Math.PI * 2) / this.sampleRate;
    const panCycle = (Math.PI * 2 * panRate) / this.sampleRate;
    let phase = 0;

    for (let i = 0; i < totalSamples; i += this.channels) {
      const signal = Math.sin(phase * frequency) * volume;

      let panPosition;
      switch (panShape) {
        case "sine":
          panPosition = Math.sin(phase * panRate * 2);
          break;
        case "triangle":
          const t = ((phase * panRate) / (Math.PI * 2)) % 1;
          panPosition = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
          break;
        case "square":
          panPosition = Math.sin(phase * panRate * 2) > 0 ? 1 : -1;
          break;
        default:
          panPosition = 0;
      }

      // Convert pan position to gains
      const leftGain = (1 - panPosition) * 0.5;
      const rightGain = (1 + panPosition) * 0.5;

      yield signal * leftGain; // Left channel
      yield signal * rightGain; // Right channel

      phase += cycle;
    }
  }
}

// Demo program
async function advancedStereoDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Advanced Stereo Demo",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    try {
      await stream.connect();
      console.log(
        `🔊 Advanced stereo demo ready: ${stream.format.description} @ ${stream.rate}Hz`
      );

      const stereo = new AdvancedStereo(stream);

      // Demo binaural beats
      console.log("🧠 Binaural beats (4Hz difference) - Use headphones!");
      await stream.write(stereo.binauralBeats(200, 4, 5.0));

      // Silence between demos
      await stream.write(stereo.addSilence(1.0));

      // Demo Haas effect
      console.log("👂 Haas effect (psychoacoustic widening)");
      await stream.write(stereo.haasEffect(440, 3.0));

      await stream.write(stereo.addSilence(1.0));

      // Demo stereo chorus
      console.log("🎭 Stereo chorus effect");
      await stream.write(stereo.stereoChorus(330, 4.0));

      await stream.write(stereo.addSilence(1.0));

      // Demo different auto-pan shapes
      console.log("🎡 Auto-pan with different shapes");
      await stream.write(stereo.autoPan(523, 2.0, 2.0, "sine"));
      await stream.write(stereo.autoPan(523, 2.0, 2.0, "triangle"));
      await stream.write(stereo.autoPan(523, 2.0, 2.0, "square"));

      console.log("✨ Advanced stereo demo complete!");
    } finally {
      await stream.dispose(); // Clean up the stream
    }
  } finally {
    await session.dispose(); // Clean up the session
  }
}

advancedStereoDemo().catch(console.error);
```

## Step 3: Run the Demos

```bash
# Basic stereo effects
node stereo-demo.mjs

# Advanced stereo effects (best with headphones)
node advanced-stereo.mjs
```

## Key Concepts

### 1. Channel Interleaving

```javascript
// For stereo (2 channels), samples alternate:
yield leftSample;   // Channel 0
yield rightSample;  // Channel 1
yield leftSample;   // Channel 0
yield rightSample;  // Channel 1
```

### 2. Panning Mathematics

```javascript
// Pan position: -1 (full left) to +1 (full right)
const leftGain = (1 - panPosition) * 0.5; // 0 to 1
const rightGain = (1 + panPosition) * 0.5; // 0 to 1
```

### 3. Mid/Side Processing

```javascript
// Decompose stereo signal
const mid = (left + right) * 0.5; // Mono sum
const side = (left - right) * 0.5; // Stereo difference

// Reconstruct with width control
const newLeft = mid + side * width;
const newRight = mid - side * width;
```

### 4. Delay-Based Effects

Many stereo effects use short delays:

- **Haas effect**: 5-40ms delay for width
- **Chorus**: Multiple delays (20-60ms) for richness
- **Stereo delay**: Longer delays for echo effects

## What You've Learned

- **Stereo sample ordering** and channel interleaving
- **Panning algorithms** for spatial positioning
- **Delay-based effects** for stereo width and richness
- **Psychoacoustic effects** like binaural beats and Haas effect
- **Mid/Side processing** for stereo width control

## Next Steps

- **[Choose the Right Audio Quality](../how-to-guides/choose-audio-quality.md)** - Optimize for your stereo application
- **[Mix Multiple Audio Sources](../how-to-guides/mix-audio-sources.md)** - Combine multiple stereo streams

## Best Practices

1. **Test with headphones** - Stereo effects are more apparent with headphones
2. **Keep volumes reasonable** - Stereo effects can increase perceived loudness
3. **Consider mono compatibility** - Your audio should still work when summed to mono
4. **Use appropriate delays** - Very short delays (< 5ms) can cause comb filtering
5. **Balance stereo width** - Too much width can make audio feel disconnected
