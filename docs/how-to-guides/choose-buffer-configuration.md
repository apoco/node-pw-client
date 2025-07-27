# How to Choose Buffer Configuration

Select the optimal buffer configuration strategy for your audio application's latency, memory, and reliability requirements.

## Quick Solution

```typescript
import { AudioOutputStream, BufferStrategy } from "pw-client";

// Most common choices:
const lowLatencyConfig = { strategy: BufferStrategy.LowLatency }; // ~10ms, real-time apps
const balancedConfig = { strategy: BufferStrategy.Balanced }; // ~20ms, general use
const memoryLimitConfig = { strategy: BufferStrategy.MaxSize, bytes: 8192 }; // 8KB memory limit
```

## Decision Framework

### By Application Type

**Real-time Interactive Applications**

- **Use**: `BufferStrategy.LowLatency` or `BufferStrategy.MinimalLatency`
- **Examples**: Gaming audio, live effects processing, MIDI instruments
- **Trade-off**: Lower latency but higher CPU usage and dropout risk

> **Why higher CPU usage?** Smaller buffers require more frequent processing interrupts. See [Buffer Configuration Concepts](../explanation/buffer-configuration.md#why-lower-latency--higher-cpu-usage) for the technical details.

```typescript
const stream = await session.createAudioOutputStream({
  name: "Game Audio Engine",
  buffering: { strategy: BufferStrategy.LowLatency }, // ~10ms latency
});
```

**Music Playback Applications**

- **Use**: `BufferStrategy.Balanced` or `BufferStrategy.Smooth`
- **Examples**: Music players, streaming audio, podcasts
- **Trade-off**: Higher latency but maximum reliability

```typescript
const stream = await session.createAudioOutputStream({
  name: "Music Player",
  buffering: { strategy: BufferStrategy.Smooth }, // ~40ms latency
});
```

**System Audio & Notifications**

- **Use**: `BufferStrategy.LowLatency` with `AudioQuality.Efficient`
- **Examples**: System sounds, alerts, voice notifications
- **Trade-off**: Optimized for responsiveness and low memory use

```typescript
const stream = await session.createAudioOutputStream({
  name: "System Notifications",
  quality: AudioQuality.Efficient,
  buffering: { strategy: BufferStrategy.LowLatency },
});
```

### By System Constraints

**Memory-Constrained Environments**

Use `MaxSize` strategy to specify the maximum memory to buffer:

```typescript
// Embedded device with 4KB audio buffer limit
const stream = await session.createAudioOutputStream({
  name: "Embedded Audio",
  buffering: {
    strategy: BufferStrategy.MaxSize,
    bytes: 4096, // No more than 4KB memory usage
  },
});
```

**Latency-Critical Applications**

Use `MaxLatency` strategy to set the buffering size based on maximum tolerable playback delay:

```typescript
// Professional audio with 5ms latency requirement
const stream = await session.createAudioOutputStream({
  name: "Professional DAW",
  buffering: {
    strategy: BufferStrategy.MaxLatency,
    milliseconds: 5,
  },
});
```

## Strategy Comparison

| Strategy         | Latency  | Memory   | Reliability | Best For                 |
| ---------------- | -------- | -------- | ----------- | ------------------------ |
| `MinimalLatency` | ~5ms     | Lowest   | Moderate    | Real-time processing     |
| `LowLatency`     | ~10ms    | Low      | Good        | Gaming, interactive apps |
| `Balanced`       | ~20ms    | Medium   | High        | General applications     |
| `Smooth`         | ~40ms    | Higher   | Highest     | Music playback           |
| `FixedLatency`   | Custom   | Variable | Depends     | Precise timing needs     |
| `FixedSize`      | Variable | Fixed    | Depends     | Memory constraints       |

_Latency estimates based on 48kHz sample rate and 256-frame quantum_

## Real-World Examples

### Gaming Audio Engine

**Requirements**: Low latency for responsive audio, moderate memory usage

```typescript
const gameAudio = await session.createAudioOutputStream({
  name: "Game Audio",
  quality: AudioQuality.Standard,
  buffering: { strategy: BufferStrategy.LowLatency },
});

// Result: ~10ms latency, ~4KB memory usage
```

### Embedded IoT Device

**Requirements**: Strict 2KB memory limit, acceptable latency up to 15ms

```typescript
const iotAudio = await session.createAudioOutputStream({
  name: "IoT Speaker",
  quality: AudioQuality.Efficient, // Uses Int16 format (2 bytes/sample)
  buffering: {
    strategy: BufferStrategy.MaxSize,
    bytes: 2048,
  },
});

// Result: ~10.7ms latency, exactly 2KB memory usage
```

### Professional Audio Workstation

**Requirements**: Ultra-low latency for monitoring, high reliability

```typescript
const daw = await session.createAudioOutputStream({
  name: "DAW Monitor",
  quality: AudioQuality.High,
  buffering: {
    strategy: BufferStrategy.MaxLatency,
    milliseconds: 3, // Professional low-latency monitoring
  },
});
```

### Background Music Player

**Requirements**: Maximum reliability, latency not critical

```typescript
const musicPlayer = await session.createAudioOutputStream({
  name: "Background Music",
  quality: AudioQuality.Standard,
  buffering: { strategy: BufferStrategy.Smooth },
});

// Result: ~42ms latency, ~16KB memory usage, maximum reliability
```

## Troubleshooting Buffer Issues

### Audio Dropouts (Underruns)

**Symptoms**: Clicks, pops, or silence in audio output

**Solutions**:

1. Increase buffer size: Move from `LowLatency` → `Balanced` → `Smooth`
2. Use fixed latency: `{ strategy: BufferStrategy.MaxLatency, milliseconds: 50 }`
3. Check system performance and reduce CPU load

### High Latency

**Symptoms**: Noticeable delay between triggering audio and hearing it

**Solutions**:

1. Decrease buffer size: Move from `Smooth` → `Balanced` → `LowLatency`
2. Use minimal latency: `{ strategy: BufferStrategy.MinimalLatency }`
3. Specify maximum latency: `{ strategy: BufferStrategy.MaxLatency, milliseconds: 5 }`

### Memory Usage Too High

**Symptoms**: Application using too much RAM for audio buffers

**Solutions**:

1. Use fixed memory limits: `{ strategy: BufferStrategy.MaxSize, bytes: 4096 }`
2. Switch to efficient quality: Use `AudioQuality.Efficient` for Int16 format
3. Reduce channels or sample rate if possible

### Inconsistent Performance

**Symptoms**: Audio quality varies based on system load

**Solutions**:

1. Use larger buffers: `BufferStrategy.Smooth` for maximum reliability
1. Profile system performance and optimize other processes

## Related Guides

- **[Buffer Configuration Concepts](../explanation/buffer-configuration.md)** - Understanding latency, memory, and trade-offs
- **[Monitor Performance](./monitor-performance.md)** - Track buffer performance and detect issues
- **[Choose Audio Quality](./choose-audio-quality.md)** - Select optimal format and sample rate settings
