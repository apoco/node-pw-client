import { startSession, AudioQuality } from "pw-client";
import { generateSineWave, generateNoise } from "./audio-utils.mjs";

// SNIPSTART live-mixer-class
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
// SNIPEND live-mixer-class

async function liveMixerDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Live Mixer Demo",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    try {
      await stream.connect();
      console.log(`🎛️ Live mixer demo @ ${stream.rate}Hz`);

      const mixer = new LiveMixer();

      // Add multiple tracks with different durations
      mixer.addTrack("bass", generateSineWave(110, 6.0, stream.rate), 0.8);
      mixer.addTrack("mid", generateSineWave(220, 4.0, stream.rate), 0.6);
      mixer.addTrack("high", generateSineWave(440, 3.0, stream.rate), 0.5);
      mixer.addTrack("noise", generateNoise(5.0, stream.rate), 0.3);

      console.log("🎵 Starting live mix with 4 tracks:");
      console.log("   🎸 Bass (110Hz, 6s, vol 0.8)");
      console.log("   🎹 Mid (220Hz, 4s, vol 0.6)");
      console.log("   🎺 High (440Hz, 3s, vol 0.5)");
      console.log("   🌊 Noise (5s, vol 0.3)");

      mixer.start();

      // Create a generator that logs track status
      function* trackStatusMix() {
        let lastCount = -1;
        for (const sample of mixer.generateMix(2)) {
          const activeCount = mixer.getActiveTrackCount();
          if (activeCount !== lastCount) {
            console.log(
              `🔊 Active tracks: ${activeCount}/${mixer.getTrackCount()}`
            );
            lastCount = activeCount;
          }
          yield sample;
        }
      }

      await stream.write(trackStatusMix());
      console.log("✅ Live mixer demo complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// Run the demo
liveMixerDemo().catch(console.error);
