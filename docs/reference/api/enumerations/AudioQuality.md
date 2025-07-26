[**pw-client**](../README.md)

***

# Enumeration: AudioQuality

Defined in: audio-quality.mts:29

Audio quality presets that balance performance and audio quality.
Quality affects the internal format negotiation order but users always
work with JavaScript Numbers (Float64).
The quality level determines the internal format negotiations for best performance.

 AudioQuality

## Example

```typescript
// For music production
const stream = await session.createAudioOutputStream({
  quality: AudioQuality.High
});

// For games and general use
const stream = await session.createAudioOutputStream({
  quality: AudioQuality.Standard
});

// For system sounds
const stream = await session.createAudioOutputStream({
  quality: AudioQuality.Efficient
});
```

## Enumeration Members

### High

> **High**: `"high"`

Defined in: audio-quality.mts:37

Highest quality audio with maximum precision.
Best for: Music production, mastering, critical listening
Performance: Highest CPU usage, best quality
Formats: Float64 → Float32 → Int32 → Int24_32 → Int16
Sample rates: 192kHz → 96kHz → 88.2kHz → 48kHz → 44.1kHz

***

### Standard

> **Standard**: `"standard"`

Defined in: audio-quality.mts:46

Balanced quality and performance.
Best for: General music playback, games, most applications
Performance: Good balance of CPU usage and quality
Formats: Float32 → Float64 → Int16 → Int32
Sample rates: 48kHz → 44.1kHz → 96kHz → 88.2kHz → 32kHz

***

### Efficient

> **Efficient**: `"efficient"`

Defined in: audio-quality.mts:55

Lower quality, optimized for performance.
Best for: Voice, system sounds, resource-constrained environments
Performance: Lowest CPU usage, acceptable quality
Formats: Int16 → Float32 → Float64 → Int32
Sample rates: 44.1kHz → 48kHz → 32kHz → 22.05kHz → 16kHz
