# Audio Sample Quick Reference

## 📏 Sample Value Range

**All audio samples must be signed floating-point values in the range -1.0 to +1.0**

```typescript
// ✅ CORRECT sample values
yield 0.0; // Silence
yield 0.5; // 50% positive amplitude
yield - 0.5; // 50% negative amplitude
yield 1.0; // Maximum positive amplitude
yield - 1.0; // Maximum negative amplitude

// ❌ INCORRECT - these will be clipped
yield 1.5; // Clipped to 1.0 (distortion)
yield - 2.0; // Clipped to -1.0 (distortion)
```

## 🔊 Volume Control

```typescript
const volume = 0.1; // 10% volume
const sample = Math.sin(phase) * volume; // Range: -0.1 to +0.1
```

## 🎵 Common Patterns

### Sine Wave

```typescript
function* sineWave(frequency: number, volume: number) {
  let phase = 0;
  const cycle = (Math.PI * 2) / sampleRate;

  while (true) {
    yield Math.sin(phase * frequency) * volume; // Always ±volume range
    phase += cycle;
  }
}
```

### Stereo from Mono

```typescript
function* monoToStereo(monoSamples: Iterable<number>) {
  for (const sample of monoSamples) {
    yield sample; // Left channel  (-1.0 to +1.0)
    yield sample; // Right channel (-1.0 to +1.0)
  }
}
```

### Safe Mixing

```typescript
function* mix(left: Iterable<number>, right: Iterable<number>) {
  const leftIter = left[Symbol.iterator]();
  const rightIter = right[Symbol.iterator]();

  while (true) {
    const l = leftIter.next();
    const r = rightIter.next();

    if (l.done || r.done) break;

    // Mix and scale down to prevent clipping
    const mixed = (l.value + r.value) * 0.5;
    yield Math.max(-1.0, Math.min(1.0, mixed)); // Ensure range
  }
}
```

## 🎯 Quality Levels

```typescript
import { AudioQuality } from "@jacobsoft/pipewire";

// High quality (music production)
quality: AudioQuality.High;

// Standard quality (general use) - Default
quality: AudioQuality.Standard;

// Efficient (system sounds, voice)
quality: AudioQuality.Efficient;

// Efficient (best performance)
quality: AudioQuality.Efficient;
```

## 🚫 Clipping Prevention

```typescript
// Manual clipping protection
function clamp(value: number): number {
  return Math.max(-1.0, Math.min(1.0, value));
}

// Safe volume scaling
function safeVolume(sample: number, volume: number): number {
  return clamp(sample * volume);
}
```
