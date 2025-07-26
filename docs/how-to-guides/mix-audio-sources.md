# Mix Multiple Audio Sources

Learn how to combine multiple audio streams, create layered soundscapes, and implement real-time audio mixing in your PipeWire applications.

## Basic Audio Mixing

### Simple Addition Mixing

The most basic way to mix audio is to add samples together:

<!-- basic-mixing.mts#simple-addition-mixing -->

```typescript
function* mixAudioSources(
  ...generators: Array<Iterable<number, unknown, unknown>>
) {
  const iterators = generators.map((gen) => gen[Symbol.iterator]());

  while (true) {
    let mixedSample = 0;
    let activeCount = 0;

    // Get next sample from each source
    for (const iterator of iterators) {
      const { value, done } = iterator.next();
      if (!done) {
        mixedSample += value;
        activeCount++;
      }
    }

    // Stop when all sources are exhausted
    if (activeCount === 0) break;

    // Average to prevent clipping
    yield mixedSample / Math.max(1, activeCount);
  }
}
```

**Example:** Run `npx tsx examples/basic-mixing.mts` to hear simple addition mixing in action.

### Weighted Mixing

Control the relative volume of each source:

<!-- basic-mixing.mts#weighted-mixing -->

```typescript
function* mixWeighted(
  sources: Array<{
    generator: Iterable<number, unknown, unknown>;
    weight: number;
  }>
) {
  const iterators = sources.map(({ generator, weight }) => ({
    iterator: generator[Symbol.iterator](),
    weight,
  }));

  while (true) {
    let mixedSample = 0;
    let activeCount = 0;

    for (const { iterator, weight } of iterators) {
      const { value, done } = iterator.next();
      if (!done) {
        mixedSample += value * weight;
        activeCount++;
      }
    }

    if (activeCount === 0) break;
    yield mixedSample;
  }
}
```

## Advanced Mixing Techniques

### Crossfading Between Sources

Smoothly transition from one audio source to another:

<!-- crossfade-mixing.mts#crossfade-mixing -->

```typescript
function* crossfade(
  source1: Iterable<number>,
  source2: Iterable<number>,
  fadeLength: number
) {
  const iter1 = source1[Symbol.iterator]();
  const iter2 = source2[Symbol.iterator]();

  let sampleCount = 0;

  while (true) {
    const result1 = iter1.next();
    const result2 = iter2.next();

    if (result1.done && result2.done) break;

    const sample1 = result1.done ? 0 : result1.value;
    const sample2 = result2.done ? 0 : result2.value;

    // Calculate crossfade ratio
    const fadeRatio = Math.min(1, sampleCount / fadeLength);
    const gain1 = Math.cos(fadeRatio * Math.PI * 0.5); // Smooth fade out
    const gain2 = Math.sin(fadeRatio * Math.PI * 0.5); // Smooth fade in

    yield sample1 * gain1 + sample2 * gain2;
    sampleCount++;
  }
}
```

**Example:** Run `npx tsx examples/crossfade-mixing.mts` to hear smooth crossfading between sine and square waves.

### Dynamic Ducking

Automatically reduce background volume when foreground audio plays:

<!-- ducking-mixing.mts#ducking-mixing -->

```typescript
function* duckingMix(
  foreground: Iterable<number, unknown, unknown>,
  background: Iterable<number, unknown, unknown>,
  threshold = 0.1,
  duckRatio = 0.3
) {
  const foregroundIter = foreground[Symbol.iterator]();
  const backgroundIter = background[Symbol.iterator]();

  while (true) {
    const fgResult = foregroundIter.next();
    const bgResult = backgroundIter.next();

    if (fgResult.done && bgResult.done) break;

    const fgSample = typeof fgResult.value === "number" ? fgResult.value : 0;
    const bgSample = typeof bgResult.value === "number" ? bgResult.value : 0;

    // Duck background when foreground is active
    const fgLevel = Math.abs(fgSample);
    const duckingGain = fgLevel > threshold ? duckRatio : 1.0;

    yield fgSample + bgSample * duckingGain;
  }
}
```

**Example:** Run `npx tsx examples/ducking-mixing.mts` to hear automatic background ducking during voice segments.

Usage example:

```typescript
// Usage: voice over music
await stream.write(duckingMix(voiceOver(), backgroundMusic()));
```

## Multi-Track Mixing

### Track-Based Mixer

Create a full mixer with multiple tracks:

<!-- audio-mixer.mts#audio-mixer-class -->

```typescript
export class AudioMixer {
  private readonly tracks: Array<{
    id: string;
    generator: Iterable<number, unknown, unknown>;
    volume: number;
    pan: number;
    mute: boolean;
    solo: boolean;
    effects: Array<(sample: number) => number>;
  }>;

  constructor() {
    this.tracks = [];
  }

  addTrack(
    generator: Iterable<number, unknown, unknown>,
    options: {
      id?: string;
      volume?: number;
      pan?: number;
      mute?: boolean;
      solo?: boolean;
      effects?: Array<(sample: number) => number>;
    } = {}
  ) {
    const track = {
      id: options.id ?? `track_${this.tracks.length}`,
      generator,
      volume: options.volume ?? 1.0,
      pan: options.pan ?? 0.0, // -1 (left) to +1 (right)
      mute: options.mute ?? false,
      solo: options.solo ?? false,
      effects: options.effects ?? [],
    };

    this.tracks.push(track);
    return track;
  }

  *mix(channels = 2) {
    const iterators = this.tracks.map((track) => ({
      ...track,
      iterator: track.generator[Symbol.iterator](),
    }));

    // Check if any track is soloed
    const hasSolo = this.tracks.some((track) => track.solo);

    while (true) {
      const channelSums = new Array<number>(channels).fill(0);
      let activeCount = 0;

      for (const track of iterators) {
        if (track.mute || (hasSolo && !track.solo)) continue;

        const { value, done } = track.iterator.next();
        if (done) continue;

        let sample = value * track.volume;

        // Apply effects
        for (const effect of track.effects) {
          sample = effect(sample);
        }

        // Apply panning for stereo
        if (channels === 2) {
          const leftGain = (1 - track.pan) * 0.5;
          const rightGain = (1 + track.pan) * 0.5;

          channelSums[0] += sample * leftGain; // Left
          channelSums[1] += sample * rightGain; // Right
        } else {
          // Mono or other channel configurations
          for (let ch = 0; ch < channels; ch++) {
            channelSums[ch] += sample / channels;
          }
        }

        activeCount++;
      }

      if (activeCount === 0) break;

      // Output mixed samples for all channels
      for (const channelSum of channelSums) {
        yield Math.max(-1, Math.min(1, channelSum));
      }
    }
  }

  setTrackVolume(trackId: string, volume: number) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.volume = volume;
  }

  setTrackPan(trackId: string, pan: number) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.pan = Math.max(-1, Math.min(1, pan));
  }

  muteTrack(trackId: string, mute = true) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.mute = mute;
  }

  soloTrack(trackId: string, solo = true) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.solo = solo;
  }
}
```

Usage example:

```typescript
// Usage
const mixer = new AudioMixer(stream.rate);

// Add tracks
mixer.addTrack(kickDrum(), { id: "kick", volume: 0.8, pan: 0 });
mixer.addTrack(snare(), { id: "snare", volume: 0.6, pan: 0.2 });
mixer.addTrack(hihat(), { id: "hihat", volume: 0.4, pan: -0.3 });
mixer.addTrack(bassline(), { id: "bass", volume: 0.7, pan: 0 });

// Mix and play
await stream.write(mixer.mix(stream.channels));
```

## Real-Time Mixing

### Live Audio Mixer

Create a mixer that can be controlled in real-time:

<!-- live-mixer.mts#live-mixer-class -->

```typescript
class LiveMixer {
  private readonly tracks: Map<
    string,
    {
      generator: Iterable<number>;
      iterator: Iterator<number>;
      volume: number;
      mute: boolean;
      finished: boolean;
    }
  >;
  private masterVolume: number;
  private isPlaying: boolean;

  constructor() {
    this.tracks = new Map();
    this.masterVolume = 1.0;
    this.isPlaying = false;
  }

  addTrack(id: string, generator: Iterable<number>, initialVolume = 1.0) {
    this.tracks.set(id, {
      generator,
      iterator: generator[Symbol.iterator](),
      volume: initialVolume,
      mute: false,
      finished: false,
    });
  }

  removeTrack(id: string) {
    this.tracks.delete(id);
  }

  setVolume(trackId: string, volume: number) {
    const track = this.tracks.get(trackId);
    if (track) track.volume = volume;
  }

  setMasterVolume(volume: number) {
    this.masterVolume = volume;
  }

  mute(trackId: string, muted = true) {
    const track = this.tracks.get(trackId);
    if (track) track.mute = muted;
  }

  *generateMix(channels = 2) {
    while (this.isPlaying && this.tracks.size > 0) {
      const channelSums = new Array<number>(channels).fill(0);
      let activeTracks = 0;

      // Mix all active tracks
      for (const track of this.tracks.values()) {
        if (track.mute || track.finished) continue;

        const result = track.iterator.next();
        if (result.done) {
          track.finished = true;
          continue;
        }

        const sample = result.value * track.volume * this.masterVolume;

        // Add to all channels (mono to stereo)
        for (let ch = 0; ch < channels; ch++) {
          channelSums[ch] += sample;
        }

        activeTracks++;
      }

      // Remove finished tracks
      for (const [id, track] of this.tracks) {
        if (track.finished) {
          this.tracks.delete(id);
        }
      }

      if (activeTracks === 0 && this.tracks.size === 0) break;

      // Output mixed samples
      for (const sum of channelSums) {
        yield Math.max(-1, Math.min(1, sum));
      }
    }
  }

  start() {
    this.isPlaying = true;
  }

  stop() {
    this.isPlaying = false;
  }

  getTrackCount() {
    return this.tracks.size;
  }

  getActiveTrackCount() {
    return Array.from(this.tracks.values()).filter(
      (track) => !track.finished && !track.mute
    ).length;
  }
}
```

Usage example:

```typescript
// Usage with real-time control
const liveMixer = new LiveMixer();

// Add some initial tracks
liveMixer.addTrack("ambient", ambientPad(), 0.3);
liveMixer.addTrack("drums", drumLoop(), 0.8);

liveMixer.start();

// Start playback
const mixerStream = liveMixer.generateMix(stream.channels);
await stream.write(mixerStream);

// Control in real-time (could be from UI events)
setTimeout(() => {
  liveMixer.addTrack("melody", melodyLine(), 0.5);
}, 2000);

setTimeout(() => {
  liveMixer.setVolume("drums", 0.4); // Reduce drum volume
}, 4000);

setTimeout(() => {
  liveMixer.stop(); // Stop the mixer
}, 10000);
```

## Audio Effects in Mixing

### Delay Effect

Add echo/delay effects to your audio:

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

### Low-Pass Filter

Smooth out harsh frequencies:

<!-- audio-utils.mts#lowpass-filter -->

```typescript
// Simple low-pass filter
export function lowPass(cutoff = 0.1) {
  let prev = 0;

  return function (sample: number) {
    prev = prev + (sample - prev) * cutoff;
    return prev;
  };
}
```

### Using Effects in Your Mixer

Usage example:

```typescript
// Add effects to mixer tracks
mixer.addTrack(vocalTrack(), {
  id: "vocals",
  volume: 0.8,
  effects: [
    delay(Math.floor(0.2 * stream.rate), 0.2, 0.3), // 200ms delay
    lowPass(0.8), // Gentle high-frequency roll-off
  ],
});
```

## Complete Mixing Example

<!-- basic-mixing.mts#complete-mixing-example -->

```typescript
async function completeMixingExample() {
  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: "Audio Mixing Demo",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();

  // Create audio sources
  function* kickDrum() {
    const duration = 0.1;
    const samples = Math.floor(duration * stream.rate);

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const env = Math.exp(-t * 8); // Exponential decay
      const osc = Math.sin(2 * Math.PI * 60 * t); // 60Hz kick
      yield osc * env * 0.8;
    }
  }

  function* sineWave(freq: number, duration: number) {
    const samples = Math.floor(duration * stream.rate);
    const cycle = (2 * Math.PI) / stream.rate;

    for (let i = 0; i < samples; i++) {
      yield Math.sin(i * cycle * freq) * 0.3;
    }
  }

  function* whiteNoise(duration: number) {
    const samples = Math.floor(duration * stream.rate);

    for (let i = 0; i < samples; i++) {
      yield (Math.random() * 2 - 1) * 0.1;
    }
  }

  // Create mixer and add tracks
  const mixer = new AudioMixer();

  mixer.addTrack(kickDrum(), { id: "kick", volume: 1.0, pan: 0 });
  mixer.addTrack(sineWave(440, 5), { id: "tone1", volume: 0.5, pan: -0.5 });
  mixer.addTrack(sineWave(550, 5), { id: "tone2", volume: 0.5, pan: 0.5 });
  mixer.addTrack(whiteNoise(5), { id: "noise", volume: 0.2, pan: 0 });

  console.log("🎛️ Playing mixed audio...");
  await stream.write(mixer.mix(stream.channels));

  console.log("✨ Mixing demo complete!");
}
```

## Best Practices

### Avoid Clipping

Monitor audio levels and apply soft limiting:

<!-- level-monitoring.mts#level-monitoring -->

```typescript
function* levelMonitor(
  generator: Iterable<number>,
  callback: (levels: { peak: number; rms: number }) => void
) {
  let peak = 0;
  let rms = 0;
  let sampleCount = 0;

  for (const sample of generator) {
    peak = Math.max(peak, Math.abs(sample));
    rms += sample * sample;
    sampleCount++;

    if (sampleCount % 1024 === 0) {
      callback({
        peak,
        rms: Math.sqrt(rms / sampleCount),
      });
      peak = 0;
      rms = 0;
      sampleCount = 0;
    }

    yield sample;
  }
}
```

For additional protection against clipping:

<!-- level-monitoring.mts#soft-limiter -->

```typescript
function softLimit(sample: number, threshold = 0.8) {
  const abs = Math.abs(sample);
  if (abs > threshold) {
    const sign = sample < 0 ? -1 : 1;
    return sign * (threshold + (abs - threshold) / (1 + (abs - threshold)));
  }
  return sample;
}
```

### Use Appropriate Data Structures

For real-time mixing, use efficient data structures:

<!-- audio-effects.mts#circular-buffer -->

```typescript
class CircularBuffer {
  private buffer: Float32Array;
  private writeIndex: number;
  private readIndex: number;
  private readonly size: number;

  constructor(size: number) {
    this.buffer = new Float32Array(size);
    this.writeIndex = 0;
    this.readIndex = 0;
    this.size = size;
  }

  write(sample: number) {
    this.buffer[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.size;
  }

  read() {
    const sample = this.buffer[this.readIndex];
    this.readIndex = (this.readIndex + 1) % this.size;
    return sample;
  }

  get length() {
    return this.writeIndex >= this.readIndex
      ? this.writeIndex - this.readIndex
      : this.size - (this.readIndex - this.writeIndex);
  }

  get bufferSize() {
    return this.size;
  }
}
```

## Summary

- **Basic mixing**: Add samples together, normalize to prevent clipping
- **Weighted mixing**: Control relative volumes of different sources
- **Advanced techniques**: Crossfading, ducking, real-time control
- **Multi-track mixing**: Create full mixer with volume, pan, mute, solo
- **Effects integration**: Apply effects to individual tracks or master bus
- **Performance**: Use efficient data structures for real-time applications

## Example Programs

Try these examples to hear different mixing techniques:

```bash
# Basic mixing techniques
npx tsx examples/basic-mixing.mts

# Smooth crossfading between waveforms
npx tsx examples/crossfade-mixing.mts

# Voice-over ducking effect
npx tsx examples/ducking-mixing.mts

# Stereo panning and effects
npx tsx examples/stereo-mixer.mts

# Live mixing with dynamic track management
npx tsx examples/live-mixer.mts

# Level monitoring and soft limiting
npx tsx examples/level-monitoring.mts
```

Remember to always keep sample values within the -1.0 to +1.0 range and consider the perceptual aspects of audio mixing for the best results.
