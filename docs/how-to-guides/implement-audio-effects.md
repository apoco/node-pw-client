# How to Implement Audio Effects

Learn how to create custom audio effects using circular buffers and generator functions for real-time audio processing.

## Problem

You want to add audio effects like delay, reverb, or filtering to your audio streams, but need efficient implementations that work well with real-time audio processing.

## Quick Solution

Use circular buffers for delay-based effects and generator functions for composable audio processing:

<!-- audio-effects.mts#delay-implementation -->

```typescript
function* delayEffect(
  generator: Iterable<number>,
  delayTime: number,
  sampleRate: number,
  feedback = 0.3,
  mix = 0.3
) {
  const delaySamples = Math.floor(delayTime * sampleRate);
  const delayBuffer = new CircularBuffer(delaySamples);

  // Fill buffer with zeros initially
  for (let i = 0; i < delaySamples; i++) {
    delayBuffer.write(0);
  }

  for (const sample of generator) {
    // Read delayed sample
    const delayed = delayBuffer.read();

    // Write current sample + feedback to buffer
    delayBuffer.write(sample + delayed * feedback);

    // Output dry + wet mix
    yield sample + delayed * mix;
  }
}
```

## Creating Delay Effects

Delay effects combine the original signal with a delayed version. The key parameters are:

- **Delay Time**: How long to delay the signal (in seconds)
- **Feedback**: How much of the delayed signal feeds back into the delay line
- **Mix**: How much delayed signal to blend with the original

The above `delayEffect` function uses a generator approach that works well with audio streams. For simpler use cases, you might prefer a stateful function approach:

<!-- audio-utils.mts#delay-effect -->

```typescript
// Simple delay effect
export function delay(delaySamples: number, feedback = 0.3, mix = 0.3) {
  const delayBuffer = new Array<number>(delaySamples).fill(0);
  let index = 0;

  return function (sample: number) {
    const delayed = delayBuffer[index];
    const output = sample + delayed * mix;

    delayBuffer[index] = sample + delayed * feedback;
    index = (index + 1) % delaySamples;

    return output;
  };
}
```

**Choose the approach that fits your needs:**

- **Generator approach** (`delayEffect`) - Best for stream processing and chaining effects
- **Function approach** (`delay`) - Best for sample-by-sample processing or when you need more control

## Performance Considerations

### Memory Usage

- Size circular buffers appropriately for your delay times
- Use `Float32Array` for better memory efficiency in long delays
- Pre-allocate buffers to avoid garbage collection

### Real-time Safety

- Avoid allocations in the audio processing loop
- Use fixed-size buffers
- Keep effect processing simple and predictable

## Common Patterns

### Echo Effect

Multiple delay taps with decreasing amplitude:

<!-- audio-effects.mts#echo-effect -->

```typescript
function* echoEffect(
  input: Iterable<number>,
  sampleRate: number,
  delayTime = 0.3,
  decayFactor = 0.6,
  numEchoes = 4
) {
  const delays = Array.from({ length: numEchoes }, (_, i) => {
    const delay = new CircularBuffer(
      Math.floor(delayTime * (i + 1) * sampleRate)
    );
    // Fill with zeros
    for (let j = 0; j < delay.bufferSize; j++) {
      delay.write(0);
    }
    return delay;
  });

  for (const sample of input) {
    let output = sample;

    // Add each echo tap
    for (let i = 0; i < delays.length; i++) {
      const delayed = delays[i].read();
      delays[i].write(sample);
      output += delayed * Math.pow(decayFactor, i + 1);
    }

    yield output;
  }
}
```

### Reverb Effect

Reverb simulates the natural reverberation of a room using multiple delay lines with different lengths:

<!-- audio-effects.mts#simple-reverb -->

```typescript
function* simpleReverb(
  input: Iterable<number>,
  sampleRate: number,
  roomSize = 0.8,
  wetMix = 0.3
) {
  // Multiple delay lines with different lengths for reverb
  const delayTimes = [0.03, 0.05, 0.07, 0.09, 0.13, 0.17, 0.23];
  const delays = delayTimes.map((time) => {
    const buffer = new CircularBuffer(Math.floor(time * sampleRate));
    for (let i = 0; i < buffer.bufferSize; i++) {
      buffer.write(0);
    }
    return buffer;
  });

  for (const sample of input) {
    let reverbSum = 0;

    // Process each delay line
    for (const delay of delays) {
      const delayed = delay.read();
      delay.write(sample + delayed * roomSize * 0.1);
      reverbSum += delayed;
    }

    const reverb = reverbSum / delays.length;
    yield sample + reverb * wetMix;
  }
}
```

### Effect Chaining

Combine multiple effects by passing the output of one effect as input to another:

<!-- audio-effects.mts#effect-chain -->

```typescript
// Chain multiple effects together
function* audioEffectChain(input: Iterable<number>, sampleRate: number) {
  // Start with the input signal
  let signal = input;

  // Add a short delay (slap-back echo)
  signal = delayEffect(signal, 0.08, sampleRate, 0.2, 0.15);

  // Add a longer delay (echo)
  signal = delayEffect(signal, 0.25, sampleRate, 0.3, 0.2);

  yield* signal;
}
```

## Complete Example

Here's a full example demonstrating various delay-based effects:

<!-- audio-effects.mts#complete-example -->

```typescript
async function audioEffectsDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Audio Effects Demo",
      quality: AudioQuality.Standard,
      channels: 1,
    });

    try {
      await stream.connect();
      console.log(`🎛️ Audio effects demo @ ${stream.rate}Hz`);

      // Generate a test tone
      const testSignal = generateTestTone(440, 2.0, stream.rate);

      console.log("🎵 Playing original signal...");
      await stream.write(testSignal);

      console.log("🔄 Adding delay effect...");
      const delayedSignal = delayEffect(
        generateTestTone(440, 2.0, stream.rate),
        0.2, // 200ms delay
        stream.rate,
        0.4, // 40% feedback
        0.3 // 30% wet mix
      );
      await stream.write(delayedSignal);

      console.log("📢 Adding echo effect...");
      const echoSignal = echoEffect(
        generateTestTone(440, 2.0, stream.rate),
        stream.rate,
        0.15, // 150ms between echoes
        0.5, // 50% decay
        3 // 3 echoes
      );
      await stream.write(echoSignal);

      console.log("🏛️ Adding reverb effect...");
      const reverbSignal = simpleReverb(
        generateTestTone(440, 2.0, stream.rate),
        stream.rate,
        0.7, // 70% room size
        0.4 // 40% wet mix
      );
      await stream.write(reverbSignal);

      console.log("🔗 Adding effect chain (slap-back + echo)...");
      const chainedSignal = audioEffectChain(
        generateTestTone(440, 2.0, stream.rate),
        stream.rate
      );
      await stream.write(chainedSignal);

      console.log("✅ Audio effects demo complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// Run the demo
audioEffectsDemo().catch(console.error);
```

## Troubleshooting

### Clicks or Pops

- Ensure smooth transitions when changing parameters
- Use fade-in/fade-out for parameter changes
- Check for buffer overflows or underflows

### High CPU Usage

- Reduce buffer sizes if possible
- Simplify effect algorithms
- Consider using lookup tables for complex calculations

### Memory Leaks

- Properly dispose of streams and sessions
- Use `await using` for automatic cleanup
- Monitor memory usage during development

## Related

- [Generate Waveforms](generate-waveforms.md) - For creating test signals
- [Monitor Performance](monitor-performance.md) - For optimizing effects
- [Mix Audio Sources](mix-audio-sources.md) - For combining effect outputs
