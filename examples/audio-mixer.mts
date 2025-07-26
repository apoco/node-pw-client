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
    } = {},
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
