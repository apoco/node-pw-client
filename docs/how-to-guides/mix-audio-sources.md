# Mix Multiple Audio Sources

Learn how to combine multiple audio streams, create layered soundscapes, and implement real-time audio mixing in your PipeWire applications.

## Basic Audio Mixing

### Simple Addition Mixing

The most basic way to mix audio is to add samples together:

```javascript
function* mixAudioSources(...generators) {
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

// Usage
function* tone1() {
  /* 440Hz tone */
}
function* tone2() {
  /* 880Hz tone */
}
function* noise() {
  /* white noise */
}

await stream.write(mixAudioSources(tone1(), tone2(), noise()));
```

### Weighted Mixing

Control the relative volume of each source:

```javascript
function* weightedMix(sources) {
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
    yield Math.max(-1, Math.min(1, mixedSample)); // Clamp to valid range
  }
}

// Usage with different volumes
await stream.write(
  weightedMix([
    { generator: backgroundMusic(), weight: 0.3 }, // Quiet background
    { generator: melody(), weight: 0.7 }, // Prominent melody
    { generator: sfx(), weight: 0.5 }, // Medium sound effects
  ])
);
```

## Advanced Mixing Techniques

### Crossfading Between Sources

Smoothly transition from one audio source to another:

```javascript
function* crossfade(sourceA, sourceB, duration, sampleRate = 48000) {
  const iteratorA = sourceA[Symbol.iterator]();
  const iteratorB = sourceB[Symbol.iterator]();
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const fadeRatio = i / totalSamples; // 0 to 1
    const gainA = 1 - fadeRatio; // 1 to 0
    const gainB = fadeRatio; // 0 to 1

    const { value: sampleA = 0 } = iteratorA.next();
    const { value: sampleB = 0 } = iteratorB.next();

    yield sampleA * gainA + sampleB * gainB;
  }

  // Continue with source B
  let nextB = iteratorB.next();
  while (!nextB.done) {
    yield nextB.value;
    nextB = iteratorB.next();
  }
}

// Usage
await stream.write(crossfade(oldTrack(), newTrack(), 3.0)); // 3-second crossfade
```

### Dynamic Ducking

Automatically reduce background volume when foreground audio plays:

```javascript
function* duckingMix(foreground, background, threshold = 0.1, duckRatio = 0.3) {
  const foregroundIter = foreground[Symbol.iterator]();
  const backgroundIter = background[Symbol.iterator]();

  while (true) {
    const fgResult = foregroundIter.next();
    const bgResult = backgroundIter.next();

    if (fgResult.done && bgResult.done) break;

    const fgSample = fgResult.value || 0;
    const bgSample = bgResult.value || 0;

    // Duck background when foreground is active
    const fgLevel = Math.abs(fgSample);
    const duckingGain = fgLevel > threshold ? duckRatio : 1.0;

    yield fgSample + bgSample * duckingGain;
  }
}

// Usage: voice over music
await stream.write(duckingMix(voiceOver(), backgroundMusic()));
```

## Multi-Track Mixing

### Track-Based Mixer

Create a full mixer with multiple tracks:

```javascript
class AudioMixer {
  constructor(sampleRate = 48000) {
    this.sampleRate = sampleRate;
    this.tracks = [];
  }

  addTrack(generator, options = {}) {
    const track = {
      id: options.id || `track_${this.tracks.length}`,
      generator,
      volume: options.volume || 1.0,
      pan: options.pan || 0.0, // -1 (left) to +1 (right)
      mute: options.mute || false,
      solo: options.solo || false,
      effects: options.effects || [],
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
      const channelSums = new Array(channels).fill(0);
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

  setTrackVolume(trackId, volume) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.volume = volume;
  }

  setTrackPan(trackId, pan) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.pan = Math.max(-1, Math.min(1, pan));
  }

  muteTrack(trackId, mute = true) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.mute = mute;
  }

  soloTrack(trackId, solo = true) {
    const track = this.tracks.find((t) => t.id === trackId);
    if (track) track.solo = solo;
  }
}

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

```javascript
class LiveMixer {
  constructor() {
    this.tracks = new Map();
    this.masterVolume = 1.0;
    this.isPlaying = false;
  }

  addTrack(id, generator, initialVolume = 1.0) {
    this.tracks.set(id, {
      generator,
      iterator: generator[Symbol.iterator](),
      volume: initialVolume,
      mute: false,
      finished: false,
    });
  }

  removeTrack(id) {
    this.tracks.delete(id);
  }

  setVolume(trackId, volume) {
    const track = this.tracks.get(trackId);
    if (track) track.volume = volume;
  }

  setMasterVolume(volume) {
    this.masterVolume = volume;
  }

  mute(trackId, muted = true) {
    const track = this.tracks.get(trackId);
    if (track) track.mute = muted;
  }

  *generateMix(channels = 2) {
    while (this.isPlaying && this.tracks.size > 0) {
      const channelSums = new Array(channels).fill(0);
      let activeTracks = 0;

      // Mix all active tracks
      for (const [id, track] of this.tracks) {
        if (track.mute || track.finished) continue;

        const { value, done } = track.iterator.next();
        if (done) {
          track.finished = true;
          continue;
        }

        const sample = value * track.volume * this.masterVolume;

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
}

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

### Simple Effects Chain

Add effects to individual tracks or the master bus:

```javascript
// Simple delay effect
function delay(delaySamples, feedback = 0.3, mix = 0.3) {
  const delayBuffer = new Array(delaySamples).fill(0);
  let index = 0;

  return function (sample) {
    const delayed = delayBuffer[index];
    const output = sample + delayed * mix;

    delayBuffer[index] = sample + delayed * feedback;
    index = (index + 1) % delaySamples;

    return output;
  };
}

// Simple low-pass filter
function lowPass(cutoff = 0.1) {
  let prev = 0;

  return function (sample) {
    prev = prev + (sample - prev) * cutoff;
    return prev;
  };
}

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

```javascript
import { startSession, AudioQuality } from "pw-client";

async function mixingDemo() {
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

  function* sineWave(freq, duration) {
    const samples = Math.floor(duration * stream.rate);
    const cycle = (2 * Math.PI) / stream.rate;

    for (let i = 0; i < samples; i++) {
      yield Math.sin(i * cycle * freq) * 0.3;
    }
  }

  function* whiteNoise(duration) {
    const samples = Math.floor(duration * stream.rate);

    for (let i = 0; i < samples; i++) {
      yield (Math.random() * 2 - 1) * 0.1;
    }
  }

  // Create mixer and add tracks
  const mixer = new AudioMixer(stream.rate);

  mixer.addTrack(kickDrum(), { id: "kick", volume: 1.0, pan: 0 });
  mixer.addTrack(sineWave(440, 5), { id: "tone1", volume: 0.5, pan: -0.5 });
  mixer.addTrack(sineWave(550, 5), { id: "tone2", volume: 0.5, pan: 0.5 });
  mixer.addTrack(whiteNoise(5), { id: "noise", volume: 0.2, pan: 0 });

  console.log("🎛️ Playing mixed audio...");
  await stream.write(mixer.mix(stream.channels));

  console.log("✨ Mixing demo complete!");
}

mixingDemo().catch(console.error);
```

## Best Practices

### Avoid Clipping

```javascript
// Always clamp mixed samples
yield Math.max(-1, Math.min(1, mixedSample));

// Or use a soft limiter
function softLimit(sample, threshold = 0.8) {
  const abs = Math.abs(sample);
  if (abs > threshold) {
    const sign = sample < 0 ? -1 : 1;
    return sign * (threshold + (abs - threshold) / (1 + (abs - threshold)));
  }
  return sample;
}
```

### Monitor Levels

```javascript
function* levelMonitor(generator, callback) {
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

### Use Appropriate Data Structures

```javascript
// For real-time mixing, use efficient data structures
class CircularBuffer {
  constructor(size) {
    this.buffer = new Float32Array(size);
    this.writeIndex = 0;
    this.readIndex = 0;
    this.size = size;
  }

  write(sample) {
    this.buffer[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.size;
  }

  read() {
    const sample = this.buffer[this.readIndex];
    this.readIndex = (this.readIndex + 1) % this.size;
    return sample;
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

Remember to always keep sample values within the -1.0 to +1.0 range and consider the perceptual aspects of audio mixing for the best results.
