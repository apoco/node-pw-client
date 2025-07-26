# Choose the Right Audio Quality

Different applications have different audio quality requirements. This guide helps you choose the optimal `AudioQuality` setting for your specific use case.

## Quick Decision Guide

```typescript
// High-fidelity music applications
quality: AudioQuality.High;

// General applications, games, media players
quality: AudioQuality.Standard; // ← Default choice

// System sounds, voice, background audio
quality: AudioQuality.Efficient;
```

## Quality Level Comparison

| Quality     | Best For                             | CPU Usage | Sample Rate Priority             | Format Priority                   |
| ----------- | ------------------------------------ | --------- | -------------------------------- | --------------------------------- |
| `High`      | Music production, critical listening | Highest   | 192kHz → 96kHz → 48kHz → 44.1kHz | Float64 → Float32 → Int32 → Int16 |
| `Standard`  | Games, media players, general apps   | Medium    | 48kHz → 44.1kHz → 96kHz → 32kHz  | Float32 → Float64 → Int16 → Int32 |
| `Efficient` | System sounds, voice, notifications  | Lowest    | 44.1kHz → 48kHz → 32kHz → 22kHz  | Int16 → Float32 → Float64 → Int32 |

_Note: Higher sample rates and bit depths require more memory bandwidth and processing power, regardless of format conversion overhead._

## When to Use Each Quality

### AudioQuality.High

**Best for:**

- Digital Audio Workstations (DAWs)
- Music production software
- Audio analysis tools
- Professional audio playback
- Critical listening applications

**Why High quality:**

```typescript
const stream = await session.createAudioOutputStream({
  name: "Professional Audio",
  quality: AudioQuality.High, // Maximum precision
  channels: 2,
  role: "Music", // Hints to PipeWire for audio routing
});
```

**Performance characteristics:**

- Prioritizes Float64/Float32 formats for maximum precision
- Prefers higher sample rates (192kHz, 96kHz) when available
- Highest memory bandwidth and CPU usage due to larger data volumes
- Higher bit depth provides more dynamic range for professional applications

### AudioQuality.Standard

**Best for:**

- Music players
- Games and interactive applications
- Video players
- General multimedia applications
- Educational software

**Why Standard quality:**

```typescript
const stream = await session.createAudioOutputStream({
  name: "Music Player",
  quality: AudioQuality.Standard, // Good balance
  channels: 2,
  role: "Music",
});
```

**Performance characteristics:**

- Balanced approach between quality and performance
- Good compatibility with most audio hardware
- Reasonable CPU usage
- Suitable for most consumer applications

### AudioQuality.Efficient

**Best for:**

- System notification sounds
- Voice applications (VoIP, voice assistants)
- Background/ambient audio
- Battery-sensitive applications
- Resource-constrained environments

**Why Efficient quality:**

```typescript
const stream = await session.createAudioOutputStream({
  name: "System Notifications",
  quality: AudioQuality.Efficient, // Minimal resources
  channels: 1, // Mono for efficiency
  role: "Notification",
});
```

**Performance characteristics:**

- Minimal CPU usage
- Prioritizes integer formats (Int16/Int32)
- Good for voice frequency ranges
- Longer acceptable latency for better efficiency

## Real-World Examples

### Music Production Application

```typescript
// High quality for critical audio work
await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "MyDAW Pro",
  quality: AudioQuality.High,
  channels: 2,
  role: "Music",
});

console.log(
  `Production ready: ${stream.format.description} @ ${stream.rate}Hz`
);
// Likely output: "Production ready: Float32 Stereo @ 48000Hz"
```

### Game Audio Engine

```typescript
// Standard quality for game audio
await using session = await startSession();

// Music/ambience stream
await using musicStream = await session.createAudioOutputStream({
  name: "Game Music",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

// Sound effects stream
await using sfxStream = await session.createAudioOutputStream({
  name: "Game SFX",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Game",
});
```

### System Integration

```typescript
// Efficient quality for system sounds
await using session = await startSession();
await using notificationStream = await session.createAudioOutputStream({
  name: "System Notifications",
  quality: AudioQuality.Efficient,
  channels: 1, // Mono is often sufficient
  role: "Notification",
});

// Play short notification sound
function* beep(frequency = 800, duration = 0.2) {
  const samples = Math.floor(duration * notificationStream.rate);
  const cycle = (Math.PI * 2) / notificationStream.rate;
  let phase = 0;

  for (let i = 0; i < samples; i++) {
    yield Math.sin(phase * frequency) * 0.3;
    phase += cycle;
  }
}

await notificationStream.write(beep());
```

## Dynamic Quality Selection

Choose quality based on runtime conditions:

```typescript
function selectQuality(context) {
  // Check system capabilities
  const isLowPowerDevice = process.arch === "arm" || process.arch === "arm64";
  const isBatteryPowered = context.powerSource === "battery";
  const isBackgroundApp = !context.hasFocus;

  // Professional audio applications always use high quality
  if (context.appType === "daw" || context.appType === "production") {
    return AudioQuality.High;
  }

  // Battery/performance considerations
  if (isLowPowerDevice || isBatteryPowered || isBackgroundApp) {
    return context.appType === "music"
      ? AudioQuality.Standard
      : AudioQuality.Efficient;
  }

  // Default to standard for most applications
  return AudioQuality.Standard;
}

// Usage
const quality = selectQuality({
  appType: "game",
  powerSource: "ac",
  hasFocus: true,
});

await using stream = await session.createAudioOutputStream({
  name: "Adaptive Quality App",
  quality,
  channels: 2,
});
```

## Quality Validation

Check what format was actually negotiated:

```typescript
await using stream = await session.createAudioOutputStream({
  name: "Quality Test",
  quality: AudioQuality.High,
  channels: 2,
});

await stream.connect();

// Check actual negotiated format
console.log(`Requested: High quality`);
console.log(`Negotiated: ${stream.format.description}`);
console.log(`Sample rate: ${stream.rate}Hz`);
console.log(`Channels: ${stream.channels}`);

// Validate if we got what we expected
const isHighQuality =
  stream.format.name.includes("Float") && stream.rate >= 44100;

if (!isHighQuality) {
  console.warn("High quality not available, got:", stream.format.description);
}
```

## Performance Testing

Measure the impact of different quality levels:

```typescript
async function benchmarkQuality(quality, testDuration = 5.0) {
  const startTime = process.hrtime.bigint();

  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: `Benchmark ${quality}`,
    quality,
    channels: 2,
  });

  await stream.connect();

  // Generate test audio
  function* testTone() {
    const samples = Math.floor(testDuration * stream.rate * stream.channels);
    const cycle = (Math.PI * 2) / stream.rate;
    let phase = 0;

    for (let i = 0; i < samples; i += stream.channels) {
      const sample = Math.sin(phase * 440) * 0.1;
      yield sample; // Left
      yield sample; // Right
      phase += cycle;
    }
  }

  await stream.write(testTone());

  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1_000_000;

  return {
    quality,
    format: stream.format.description,
    rate: stream.rate,
    processingTimeMs: durationMs,
    realTimeRatio: durationMs / (testDuration * 1000),
  };
}

// Compare all quality levels
const qualities = [
  AudioQuality.Efficient,
  AudioQuality.Standard,
  AudioQuality.High,
];
for (const quality of qualities) {
  const result = await benchmarkQuality(quality);
  console.log(
    `${quality}: ${result.format} - ${result.realTimeRatio.toFixed(3)}x realtime`
  );
}
```

## Common Pitfalls

### ❌ Don't always use High quality

```typescript
// Wrong: Unnecessarily high quality for notifications
await session.createAudioOutputStream({
  quality: AudioQuality.High, // Overkill!
  role: "Notification",
});
```

```typescript
// Right: Appropriate quality for use case
await session.createAudioOutputStream({
  quality: AudioQuality.Efficient, // Perfect for notifications
  role: "Notification",
});
```

### ❌ Don't ignore the negotiated format

```typescript
// Wrong: Assuming format without checking
await stream.connect();
// Assuming we got Float64...

// Right: Check what was actually negotiated
await stream.connect();
console.log(`Actually got: ${stream.format.description}`);
```

### ❌ Don't use fixed quality for all users

```typescript
// Wrong: Same quality for all users
const quality = AudioQuality.High;

// Right: Adapt to user's context
const quality = userPreferences.audiophile
  ? AudioQuality.High
  : AudioQuality.Standard;
```

## Summary

- **AudioQuality.High**: Professional audio, maximum precision, variable CPU usage
- **AudioQuality.Standard**: General applications, balanced performance
- **AudioQuality.Efficient**: System sounds, voice, minimal resources
- Always check the negotiated format with `stream.format.description`
- Consider user context, device capabilities, and power constraints
- Test performance impact in your specific application
