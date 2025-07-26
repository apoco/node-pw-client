import type { AudioOutputStream } from "pw-client";

// SNIPSTART simple-synth-class
export class SimpleSynth {
  public stream: AudioOutputStream;
  public volume: number;

  constructor(stream: AudioOutputStream) {
    this.stream = stream;
    this.volume = 0.3; // Default volume (30%)
  }

  // SNIPSTART note-to-frequency
  // Convert musical note to frequency
  noteToFrequency(note: string, octave = 4) {
    const notes: Record<string, number> = {
      C: -9,
      "C#": -8,
      Db: -8,
      D: -7,
      "D#": -6,
      Eb: -6,
      E: -5,
      F: -4,
      "F#": -3,
      Gb: -3,
      G: -2,
      "G#": -1,
      Ab: -1,
      A: 0,
      "A#": 1,
      Bb: 1,
      B: 2,
    };

    const semitone = notes[note];
    if (semitone === undefined) {
      throw new Error(`Unknown note: ${note}`);
    }

    // A4 = 440Hz, each octave doubles/halves frequency
    return 440 * Math.pow(2, octave - 4 + semitone / 12);
  }
  // SNIPEND note-to-frequency

  // Generate different waveforms
  *generateWave(type: string, frequency: number, duration: number) {
    const sampleRate = this.stream.rate;
    const channels = this.stream.channels;
    const totalSamples = Math.floor(duration * sampleRate * channels);

    const cycle = (Math.PI * 2) / sampleRate;
    let phase = 0;

    for (let i = 0; i < totalSamples; i += channels) {
      let sample;

      switch (type) {
        case "sine":
          sample = Math.sin(phase * frequency);
          break;

        case "square":
          sample = Math.sin(phase * frequency) > 0 ? 1 : -1;
          break;

        case "sawtooth":
          sample = 2 * (((phase * frequency) / (Math.PI * 2)) % 1) - 1;
          break;

        case "triangle": {
          const t = ((phase * frequency) / (Math.PI * 2)) % 1;
          sample = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
          break;
        }

        default:
          throw new Error(`Unknown waveform: ${type}`);
      }

      // Apply volume and output to all channels
      sample *= this.volume;
      for (let ch = 0; ch < channels; ch++) {
        yield sample;
      }

      phase += cycle;
    }
  }

  // Play a musical note
  async playNote(
    note: string,
    octave: number,
    duration: number,
    waveform = "sine"
  ) {
    const frequency = this.noteToFrequency(note, octave);
    console.log(
      `🎵 Playing ${note}${octave} (${frequency.toFixed(1)}Hz) - ${waveform} for ${duration}s`
    );

    await this.stream.write(this.generateWave(waveform, frequency, duration));
  }

  // Play a sequence of notes
  async playSequence(
    sequence: Array<{
      note: string;
      octave: number;
      duration: number;
      waveform: string;
    }>
  ) {
    for (const { note, octave, duration, waveform } of sequence) {
      await this.playNote(note, octave, duration, waveform);
    }
  }

  // Add some silence
  async addSilence(duration: number) {
    const sampleRate = this.stream.rate;
    const channels = this.stream.channels;
    const totalSamples = Math.floor(duration * sampleRate * channels);

    function* silence() {
      for (let i = 0; i < totalSamples; i++) {
        yield 0.0; // Silence
      }
    }

    await this.stream.write(silence());
  }

  // Play chord by mixing frequencies
  async playChord(notes: Array<string>, octave: number, duration: number) {
    const frequencies = notes.map((note) => this.noteToFrequency(note, octave));

    const sampleRate = this.stream.rate;
    const channels = this.stream.channels;
    const totalSamples = Math.floor(duration * sampleRate * channels);

    const cycle = (Math.PI * 2) / sampleRate;
    let phase = 0;

    const that = this;
    function* generateChord() {
      for (let i = 0; i < totalSamples; i += channels) {
        // Mix all frequencies together
        let sample = 0;
        for (const freq of frequencies) {
          sample += Math.sin(phase * freq);
        }
        sample = (sample / frequencies.length) * that.volume; // Average and apply volume

        for (let ch = 0; ch < channels; ch++) {
          yield sample;
        }
        phase += cycle;
      }
    }

    console.log(
      `🎼 Playing chord: ${notes.join("-")}${octave} for ${duration}s`
    );
    await this.stream.write(generateChord());
  }
}

// SNIPEND simple-synth-class
