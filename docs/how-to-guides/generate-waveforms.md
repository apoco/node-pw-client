# Generate Common Waveforms

This guide shows you how to generate the fundamental waveforms used in audio synthesis: sine, square, sawtooth, and triangle waves, plus noise generators.

> **📁 Complete Example**: [`examples/waveform-generation.mts`](../../examples/waveform-generation.mts)
>
> ```bash
> npx tsx examples/waveform-generation.mts
> ```

## Sine Wave

Pure tone with smooth, fundamental frequency:

<!-- audio-utils.mts#sine-wave-generator -->

```typescript
export function* generateSineWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    yield Math.sin(i * cycle * frequency) * volume;
  }
}
```

<!-- waveform-generation.mts#sine-wave -->

```typescript
// Usage
console.log("🎵 Playing sine wave...");
await stream.write(generateSineWave(440, 1.0, stream.rate));
```

## Square Wave

Digital-sounding wave with odd harmonics:

<!-- audio-utils.mts#square-wave-generator -->

```typescript
export function* generateSquareWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    yield (Math.sin(i * cycle * frequency) > 0 ? 1 : -1) * volume;
  }
}
```

<!-- waveform-generation.mts#square-wave -->

```typescript
// Usage
console.log("🎵 Playing square wave...");
await stream.write(generateSquareWave(440, 1.0, stream.rate));
```

## Sawtooth Wave

Bright, buzzy sound with all harmonics:

<!-- audio-utils.mts#sawtooth-wave-generator -->

```typescript
export function* generateSawtoothWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    // Convert phase to sawtooth: rises from -1 to +1, then jumps back
    const normalized = ((i * cycle * frequency) / (Math.PI * 2)) % 1;
    yield (normalized * 2 - 1) * volume;
  }
}
```

<!-- waveform-generation.mts#sawtooth-wave -->

```typescript
// Usage
console.log("🎵 Playing sawtooth wave...");
await stream.write(generateSawtoothWave(440, 1.0, stream.rate));
```

## Triangle Wave

Softer than square, fewer harmonics than sawtooth:

<!-- audio-utils.mts#triangle-wave-generator -->

```typescript
export function* generateTriangleWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    const normalized = ((i * cycle * frequency) / (Math.PI * 2)) % 1;
    // Triangle: rises from 0 to 1, then falls from 1 to 0
    const triangle = normalized < 0.5 ? normalized * 2 : 2 - normalized * 2;
    yield (triangle * 2 - 1) * volume;
  }
}
```

<!-- waveform-generation.mts#triangle-wave -->

```typescript
// Usage
console.log("🎵 Playing triangle wave...");
await stream.write(generateTriangleWave(440, 1.0, stream.rate));
```

## White Noise

Equal energy at all frequencies:

<!-- audio-utils.mts#noise-generator -->

```typescript
export function* generateNoise(
  duration: number,
  sampleRate: number,
  volume = 0.1
) {
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    yield (Math.random() * 2 - 1) * volume;
  }
}
```

<!-- waveform-generation.mts#white-noise -->

```typescript
// Usage
console.log("🎵 Playing white noise...");
await stream.write(generateNoise(1.0, stream.rate));
```

## Pink Noise (1/f Noise)

More energy in lower frequencies; sounds more natural:

<!-- waveform-generation.mts#pink-noise -->

```typescript
function* pinkNoise(duration: number, volume = 0.1) {
  const samples = Math.floor(duration * stream.rate);

  // Simple pink noise approximation using multiple octaves
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;

  for (let i = 0; i < samples; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;

    yield pink * volume * 0.11; // Scale down
  }
}

// Usage
console.log("🎵 Playing pink noise...");
await stream.write(pinkNoise(1.0));

console.log("✨ Waveform demo complete!");
```

## Band-Limited Sawtooth (Reduces Aliasing)

Advanced technique that prevents aliasing artifacts:

<!-- waveform-generation.mts#band-limited-sawtooth -->

```typescript
function* bandLimitedSawtooth(
  frequency: number,
  duration: number,
  volume = 0.3
) {
  const samples = Math.floor(duration * stream.rate);
  const cycle = (Math.PI * 2) / stream.rate;
  let phase = 0;

  // Calculate maximum harmonic to avoid aliasing
  const maxHarmonic = Math.floor(stream.rate / (2 * frequency));

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

// Demo the band-limited sawtooth
console.log("🎵 Playing band-limited sawtooth (reduces aliasing)...");
await stream.write(bandLimitedSawtooth(440, 1.0));
```

## Try It Yourself

Run the complete example to hear all waveforms in action:

```bash
npx tsx examples/waveform-generation.mts
```

This will demonstrate each waveform type with real audio output, showing how different mathematical functions produce distinctly different sounds.

## Summary

- **Sine waves**: Pure tones, fundamental building blocks
- **Square waves**: Digital sounds, odd harmonics only
- **Sawtooth waves**: Bright, buzzy, all harmonics
- **Triangle waves**: Softer than square, fewer harmonics
- **White noise**: Equal energy at all frequencies
- **Pink noise**: More natural, 1/f frequency distribution

Always remember to:

- Keep sample values between -1.0 and +1.0
- Consider aliasing with high-frequency content
- Use appropriate volume levels to prevent clipping
