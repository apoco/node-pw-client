# Audio Quality API

## 🎯 Overview

The Audio Quality API eliminates the confusion between technical audio formats and JavaScript programming. You always work with JavaScript `Number` values (Float64) in the standard audio range of **-1.0 to +1.0**, while the library automatically handles optimal format negotiation based on your quality requirements.

## ✨ Key Benefits

- **No Technical Knowledge Required**: Choose `High`, `Standard`, or `Efficient` - no need to understand bit depths or sample formats
- **Standard Audio Range**: Always use signed floating-point values from **-1.0 to +1.0** (standard audio sample format)
- **Always Use JavaScript Numbers**: Write audio code with `number` values as usual - conversion happens automatically
- **Optimal Performance**: Each quality level uses the best format negotiation strategy for its use case
- **Future-Proof**: Quality levels abstract away hardware differences and PipeWire version changes

## 📊 Quality Levels

### `AudioQuality.High`

**Best for:** Music production, mastering, critical listening

```typescript
quality: AudioQuality.High;
```

- **Priority:** Maximum audio precision
- **Performance:** Highest CPU usage, best quality
- **Format Strategy:** Float64 → Float32 → Int32 → Int16
- **Use Cases:** DAWs, audio editing, professional music playback

### `AudioQuality.Standard` (Default)

**Best for:** General music playback, games, most applications

```typescript
quality: AudioQuality.Standard;
```

- **Priority:** Balanced quality and performance
- **Performance:** Good balance of CPU usage and quality
- **Format Strategy:** Float32 → Float64 → Int16 → Int32
- **Use Cases:** Music players, games, general applications

### `AudioQuality.Efficient`

**Best for:** Voice, system sounds, resource-constrained environments

```typescript
quality: AudioQuality.Efficient;
```

- **Priority:** Performance optimization
- **Performance:** Lowest CPU usage, acceptable quality
- **Format Strategy:** Int16 → Float32 → Float64 → Int32
- **Use Cases:** Voice chat, notifications, embedded systems

## 🚀 Basic Usage

> **📏 Important**: All audio samples must be **signed floating-point values** in the range **-1.0 to +1.0**.  
> See the [Audio Sample Values](#-audio-sample-values) section below for details.

### Simple Stereo Playback

```typescript
import { startSession, AudioQuality } from "@jacobsoft/pipewire";

await using session = await startSession();

await using stream = await session.createAudioOutputStream({
  name: "My Audio App",
  quality: AudioQuality.Standard, // 🎯 Simple!
  rate: 48_000,
  channels: 2,
});

await stream.connect();

// Always work with JavaScript Numbers in the range -1.0 to +1.0
// This is the standard audio sample format used across all audio systems
function* generateTone(frequency: number, duration: number) {
  const samples = Math.floor(duration * 48_000 * 2); // stereo
  const cycle = (Math.PI * 2) / 48_000;
  let phase = 0;

  for (let i = 0; i < samples; i += 2) {
    const sample = Math.sin(phase * frequency) * 0.1; // Range: -0.1 to +0.1 (10% volume)
    yield sample; // Left channel
    yield sample; // Right channel
    phase += cycle;
  }
}

await stream.write(generateTone(440, 2.0)); // 2 second A4 note
```

## 📏 Audio Sample Values

### Range: -1.0 to +1.0

All audio samples must be **signed floating-point values** in the range **-1.0 to +1.0**:

- **`-1.0`**: Maximum negative amplitude (loudest negative peak)
- **`0.0`**: Silence (no sound)
- **`+1.0`**: Maximum positive amplitude (loudest positive peak)

### Volume Control

```typescript
// Different volume levels (as fractions of maximum amplitude)
const silence = 0.0; // No sound
const whisper = 0.01; // 1% volume
const quiet = 0.1; // 10% volume
const normal = 0.5; // 50% volume
const loud = 0.9; // 90% volume
const maximum = 1.0; // 100% volume (maximum safe level)

// Generate a 440Hz sine wave at 10% volume
function* generateTone(frequency: number, volume: number) {
  let phase = 0;
  const cycle = (Math.PI * 2) / 48_000;

  while (true) {
    const sample = Math.sin(phase * frequency) * volume; // volume scales the amplitude
    yield sample; // Always in range -volume to +volume
    phase += cycle;
  }
}
```

### ⚠️ Important: Clipping Prevention

Values outside the -1.0 to +1.0 range will be automatically clipped:

```typescript
// ❌ BAD: Values outside range get clipped
yield 1.5; // Clipped to 1.0 (distortion)
yield - 2.0; // Clipped to -1.0 (distortion)

// ✅ GOOD: Keep values in proper range
yield Math.max(-1.0, Math.min(1.0, yourSample)); // Manual clipping
yield yourSample * 0.9; // Scale down to prevent clipping
```

### Quality Comparison

```typescript
// Music production - maximum quality
const musicStream = await session.createAudioOutputStream({
  quality: AudioQuality.High,
  channels: 2,
  role: "Music",
});

// System notifications - optimized for efficiency
const notificationStream = await session.createAudioOutputStream({
  quality: AudioQuality.Efficient,
  channels: 2,
  role: "Notification",
});
```

## 🔧 Advanced Usage

### Quality Information

Quality levels are documented with JSDoc comments:

```typescript
import { AudioQuality } from "@jacobsoft/pipewire";

// Quality levels with descriptions available in IDE:
// AudioQuality.High - Highest quality audio with maximum precision
// AudioQuality.Standard - Balanced quality and performance
// AudioQuality.Efficient - Performance-optimized audio
```

```typescript
// Monitor format negotiation
stream.on("formatChange", (format) => {
  console.log(`Format: ${format.format} @ ${format.rate}Hz`);
});
```

### Override Format Preferences (Advanced)

```typescript
// For power users who want to specify exact format preferences
await using stream = await session.createAudioOutputStream({
  preferredFormats: [AudioFormat.Float64, AudioFormat.Int16], // Manual control
  // quality is ignored when preferredFormats is specified
});
```

## 🎵 Mono vs Stereo

### Stereo Playback (Recommended)

```typescript
// ✅ RECOMMENDED: Use 2 channels for proper headphone/speaker playback
await using stream = await session.createAudioOutputStream({
  channels: 2, // Plays in both ears/speakers
  quality: AudioQuality.Standard,
});

// For mono content, duplicate to both channels:
function* monoToStereo(monoSamples: Iterable<number>) {
  for (const sample of monoSamples) {
    yield sample; // Left channel  (range: -1.0 to +1.0)
    yield sample; // Right channel (range: -1.0 to +1.0)
  }
}
```

### True Mono (Advanced)

```typescript
// ⚠️ ADVANCED: True mono - plays in one ear only (standard audio behavior)
await using stream = await session.createAudioOutputStream({
  channels: 1, // Professional mono stream
  quality: AudioQuality.High,
});
```

## Performance Characteristics

| Quality Level | CPU Usage | Memory Usage | Typical Latency | Best For         |
| ------------- | --------- | ------------ | --------------- | ---------------- |
| High          | Highest   | Highest      | Low             | Music Production |
| Standard      | Medium    | Medium       | Medium          | General Apps     |
| Efficient     | Lowest    | Lowest       | Medium          | System Sounds    |

## 🔧 Advanced Format Control

For power users who need explicit control over audio format negotiation:

```typescript
import { AudioFormat } from "@jacobsoft/pipewire";

// Manual format control for specialized use cases
await using stream = await session.createAudioOutputStream({
  preferredFormats: [AudioFormat.Float64, AudioFormat.Float32],
  // quality is ignored when preferredFormats is specified
});
```

> **💡 Tip:** The quality-based API is recommended for most applications as it automatically chooses optimal formats for your use case.
