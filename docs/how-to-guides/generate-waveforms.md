# Generate Common Waveforms

This guide shows you how to generate the fundamental waveforms used in audio synthesis: sine, square, sawtooth, and triangle waves, plus noise generators.

## Basic Waveform Generators

### Sine Wave

Pure tone with smooth, fundamental frequency:

```javascript
function* sineWave(frequency, duration, volume = 0.3, sampleRate = 48000) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    yield Math.sin(phase * frequency) * volume;
    phase += cycle;
  }
}

// Usage
await stream.write(sineWave(440, 2.0)); // A4 for 2 seconds
```

### Square Wave

Digital-sounding wave with odd harmonics:

```javascript
function* squareWave(frequency, duration, volume = 0.3, sampleRate = 48000) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    // Positive when sine is positive, negative when sine is negative
    yield Math.sin(phase * frequency) > 0 ? volume : -volume;
    phase += cycle;
  }
}

// Usage
await stream.write(squareWave(220, 1.5)); // Lower frequency square wave
```

### Sawtooth Wave

Bright, buzzy sound with all harmonics:

```javascript
function* sawtoothWave(frequency, duration, volume = 0.3, sampleRate = 48000) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    // Convert phase to sawtooth: rises from -1 to +1, then jumps back
    const normalized = ((phase * frequency) / (Math.PI * 2)) % 1;
    yield (2 * normalized - 1) * volume;
    phase += cycle;
  }
}

// Usage
await stream.write(sawtoothWave(330, 2.0)); // Sawtooth wave
```

### Triangle Wave

Softer than square, fewer harmonics than sawtooth:

```javascript
function* triangleWave(frequency, duration, volume = 0.3, sampleRate = 48000) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    const normalized = ((phase * frequency) / (Math.PI * 2)) % 1;
    // Triangle: rise from -1 to +1, then fall back to -1
    const triangle =
      normalized < 0.5
        ? 4 * normalized - 1 // Rising: -1 to +1
        : 3 - 4 * normalized; // Falling: +1 to -1

    yield triangle * volume;
    phase += cycle;
  }
}

// Usage
await stream.write(triangleWave(440, 1.0)); // Triangle wave
```

## Advanced Waveform Techniques

### Band-Limited Sawtooth (Reduces Aliasing)

```javascript
function* bandLimitedSawtooth(
  frequency,
  duration,
  volume = 0.3,
  sampleRate = 48000
) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  // Calculate maximum harmonic to avoid aliasing
  const maxHarmonic = Math.floor(sampleRate / (2 * frequency));

  for (let i = 0; i < samples; i++) {
    let sample = 0;

    // Sum harmonics up to Nyquist frequency
    for (let harmonic = 1; harmonic <= maxHarmonic; harmonic++) {
      sample += Math.sin(phase * frequency * harmonic) / harmonic;
    }

    yield (sample * volume * 2) / Math.PI; // Scale to proper amplitude
    phase += cycle;
  }
}
```

### Pulse Wave (Variable Duty Cycle)

```javascript
function* pulseWave(
  frequency,
  duration,
  dutyCycle = 0.5,
  volume = 0.3,
  sampleRate = 48000
) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    const normalized = ((phase * frequency) / (Math.PI * 2)) % 1;
    yield normalized < dutyCycle ? volume : -volume;
    phase += cycle;
  }
}

// Usage
await stream.write(pulseWave(440, 2.0, 0.25)); // 25% duty cycle (narrow pulse)
await stream.write(pulseWave(440, 2.0, 0.75)); // 75% duty cycle (wide pulse)
```

## Noise Generators

### White Noise

Equal energy at all frequencies:

```javascript
function* whiteNoise(duration, volume = 0.3, sampleRate = 48000) {
  const samples = Math.floor(duration * sampleRate);

  for (let i = 0; i < samples; i++) {
    // Random value between -1 and +1
    yield (Math.random() * 2 - 1) * volume;
  }
}

// Usage
await stream.write(whiteNoise(3.0, 0.1)); // 3 seconds of quiet white noise
```

### Pink Noise (1/f Noise)

More energy in lower frequencies, sounds more natural:

```javascript
function* pinkNoise(duration, volume = 0.3, sampleRate = 48000) {
  const samples = Math.floor(duration * sampleRate);

  // Pink noise filter state
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;

  for (let i = 0; i < samples; i++) {
    const white = Math.random() * 2 - 1;

    // Paul Kellett's pink noise filter
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;

    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;

    yield pink * volume * 0.11; // Scale to reasonable amplitude
  }
}

// Usage
await stream.write(pinkNoise(4.0, 0.15)); // 4 seconds of pink noise
```

### Brown Noise (Red Noise)

Even more energy in low frequencies:

```javascript
function* brownNoise(duration, volume = 0.3, sampleRate = 48000) {
  const samples = Math.floor(duration * sampleRate);
  let lastOutput = 0;

  for (let i = 0; i < samples; i++) {
    const white = Math.random() * 2 - 1;

    // Integrate white noise (simple brown noise)
    lastOutput = (lastOutput + white * 0.02) * 0.998;

    // Prevent DC buildup
    yield lastOutput * volume;
  }
}

// Usage
await stream.write(brownNoise(3.0, 0.2)); // 3 seconds of brown noise
```

## Composite Waveforms

### Additive Synthesis

Combine multiple sine waves to create complex timbres:

```javascript
function* additiveSynth(
  fundamentalFreq,
  harmonics,
  duration,
  volume = 0.3,
  sampleRate = 48000
) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    let sample = 0;

    // Add each harmonic
    harmonics.forEach(({ harmonic, amplitude }) => {
      sample += Math.sin(phase * fundamentalFreq * harmonic) * amplitude;
    });

    yield sample * volume;
    phase += cycle;
  }
}

// Create a bell-like sound
const bellHarmonics = [
  { harmonic: 1, amplitude: 1.0 }, // Fundamental
  { harmonic: 2, amplitude: 0.5 }, // Octave
  { harmonic: 3, amplitude: 0.25 }, // Fifth
  { harmonic: 4, amplitude: 0.125 }, // Double octave
];

await stream.write(additiveSynth(220, bellHarmonics, 3.0));
```

### FM Synthesis (Frequency Modulation)

Create rich, evolving sounds:

```javascript
function* fmSynth(
  carrierFreq,
  modulatorFreq,
  modulationDepth,
  duration,
  volume = 0.3,
  sampleRate = 48000
) {
  const samples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    // Modulator signal
    const modulator = Math.sin(phase * modulatorFreq) * modulationDepth;

    // Carrier frequency modulated by modulator
    const modulatedFreq = carrierFreq + modulator;

    yield Math.sin(phase * modulatedFreq) * volume;
    phase += cycle;
  }
}

// Create a vibrato-like effect
await stream.write(fmSynth(440, 5, 20, 3.0)); // 440Hz carrier, 5Hz mod, 20Hz depth
```

## Stereo Waveforms

Adapt any waveform for stereo output:

```javascript
function* stereoWaveform(monoGenerator, channels = 2) {
  for (const sample of monoGenerator) {
    // Output the same sample to all channels
    for (let ch = 0; ch < channels; ch++) {
      yield sample;
    }
  }
}

// Convert any mono generator to stereo
await stream.write(stereoWaveform(sineWave(440, 2.0), stream.channels));
```

Or create stereo-specific effects:

```javascript
function* stereoSineWithDetuning(
  frequency,
  detuneHz,
  duration,
  volume = 0.3,
  sampleRate = 48000
) {
  const samples = Math.floor(duration * sampleRate * 2); // 2 channels
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i += 2) {
    // Left channel: original frequency
    yield Math.sin(phase * frequency) * volume;

    // Right channel: slightly detuned
    yield Math.sin(phase * (frequency + detuneHz)) * volume;

    phase += cycle;
  }
}

// Create a "beating" effect between left and right channels
await stream.write(stereoSineWithDetuning(440, 2, 4.0)); // 2Hz beating
```

## Practical Example: Waveform Synthesizer

```javascript
import { startSession, AudioQuality } from "pw-client";

class WaveformSynth {
  constructor(stream) {
    this.stream = stream;
  }

  async playWaveform(type, frequency, duration, volume = 0.3) {
    let generator;

    switch (type.toLowerCase()) {
      case "sine":
        generator = this.sineWave(frequency, duration, volume);
        break;
      case "square":
        generator = this.squareWave(frequency, duration, volume);
        break;
      case "sawtooth":
        generator = this.sawtoothWave(frequency, duration, volume);
        break;
      case "triangle":
        generator = this.triangleWave(frequency, duration, volume);
        break;
      case "white":
        generator = this.whiteNoise(duration, volume);
        break;
      case "pink":
        generator = this.pinkNoise(duration, volume);
        break;
      default:
        throw new Error(`Unknown waveform: ${type}`);
    }

    // Convert to stereo if needed
    const stereoGenerator =
      this.stream.channels === 2 ? this.toStereo(generator) : generator;

    await this.stream.write(stereoGenerator);
  }

  *toStereo(monoGenerator) {
    for (const sample of monoGenerator) {
      yield sample; // Left
      yield sample; // Right
    }
  }

  // Include all the waveform generators from above...
  *sineWave(frequency, duration, volume) {
    // ... (implementation from above)
  }

  // ... other waveform methods
}

// Demo usage
async function waveformDemo() {
  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: "Waveform Synthesizer",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();
  const synth = new WaveformSynth(stream);

  console.log("🌊 Waveform Demo");

  const waveforms = ["sine", "square", "sawtooth", "triangle"];
  for (const waveform of waveforms) {
    console.log(`Playing ${waveform} wave...`);
    await synth.playWaveform(waveform, 440, 1.5);
    await new Promise((resolve) => setTimeout(resolve, 200)); // Brief pause
  }

  console.log("🔊 Noise Demo");
  await synth.playWaveform("white", 0, 2.0);
  await synth.playWaveform("pink", 0, 2.0);
}

waveformDemo().catch(console.error);
```

## Summary

- **Sine waves**: Pure tones, fundamental building blocks
- **Square waves**: Digital sounds, odd harmonics only
- **Sawtooth waves**: Bright, buzzy, all harmonics
- **Triangle waves**: Softer than square, fewer harmonics
- **White noise**: Equal energy at all frequencies
- **Pink noise**: More natural, 1/f frequency distribution
- **FM synthesis**: Rich, evolving sounds through frequency modulation
- **Additive synthesis**: Complex timbres from multiple sine waves

Always remember to:

- Keep sample values between -1.0 and +1.0
- Consider aliasing with high-frequency content
- Adapt mono generators for stereo output when needed
- Use appropriate volume levels to prevent clipping
