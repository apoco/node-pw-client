# Building a Simple Synthesizer

In this tutorial, we'll create a basic synthesizer that can play different notes and waveforms. You'll learn how to generate various waveforms, control pitch and volume, and create a simple musical sequence.

## What You'll Build

A command-line synthesizer that can:

- Generate sine, square, and sawtooth waves
- Play different musical notes
- Control volume and duration
- Play simple melodies

## Prerequisites

- Complete the [Getting Started](getting-started.md) tutorial
- Basic understanding of audio synthesis concepts
- Familiarity with JavaScript functions and objects

## Step 1: Basic Synthesizer Structure

Create `synthesizer.mjs`:

```javascript
import { startSession, AudioQuality } from "pw-client";

class SimpleSynth {
  constructor(stream) {
    this.stream = stream;
    this.volume = 0.3; // Default volume (30%)
  }

  // Convert musical note to frequency
  noteToFrequency(note, octave = 4) {
    const notes = {
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

  // Generate different waveforms
  *generateWave(type, frequency, duration) {
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

        case "triangle":
          const t = ((phase * frequency) / (Math.PI * 2)) % 1;
          sample = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
          break;

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
  async playNote(note, octave, duration, waveform = "sine") {
    const frequency = this.noteToFrequency(note, octave);
    console.log(
      `🎵 Playing ${note}${octave} (${frequency.toFixed(1)}Hz) - ${waveform} for ${duration}s`
    );

    await this.stream.write(this.generateWave(waveform, frequency, duration));
  }

  // Play a sequence of notes
  async playSequence(sequence) {
    for (const { note, octave, duration, waveform } of sequence) {
      await this.playNote(note, octave, duration, waveform);
    }
  }

  // Add some silence
  async addSilence(duration) {
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
}

// Main demo function
async function synthDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Simple Synthesizer",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    try {
      await stream.connect();
      console.log(
        `🔊 Synthesizer ready: ${stream.format.description} @ ${stream.rate}Hz`
      );

      const synth = new SimpleSynth(stream);

      // Demo 1: Different waveforms playing the same note
      console.log("\n🌊 Waveform Demo:");
      await synth.playNote("A", 4, 1.0, "sine");
      await synth.addSilence(0.2);
      await synth.playNote("A", 4, 1.0, "square");
      await synth.addSilence(0.2);
      await synth.playNote("A", 4, 1.0, "sawtooth");
      await synth.addSilence(0.2);
      await synth.playNote("A", 4, 1.0, "triangle");

      await synth.addSilence(1.0);

      // Demo 2: Simple melody (Mary Had a Little Lamb)
      console.log("\n🎼 Melody Demo:");
      const melody = [
        { note: "E", octave: 4, duration: 0.5, waveform: "sine" },
        { note: "D", octave: 4, duration: 0.5, waveform: "sine" },
        { note: "C", octave: 4, duration: 0.5, waveform: "sine" },
        { note: "D", octave: 4, duration: 0.5, waveform: "sine" },
        { note: "E", octave: 4, duration: 0.5, waveform: "sine" },
        { note: "E", octave: 4, duration: 0.5, waveform: "sine" },
        { note: "E", octave: 4, duration: 1.0, waveform: "sine" },
      ];

      await synth.playSequence(melody);

      await synth.addSilence(1.0);

      // Demo 3: Volume control
      console.log("\n🔊 Volume Demo:");
      synth.volume = 0.1;
      await synth.playNote("C", 5, 0.5, "sine");

      synth.volume = 0.3;
      await synth.playNote("C", 5, 0.5, "sine");

      synth.volume = 0.6;
      await synth.playNote("C", 5, 0.5, "sine");

      console.log("\n✨ Synthesizer demo complete!");
    } finally {
      await stream.dispose(); // Clean up the stream
    }
  } finally {
    await session.dispose(); // Clean up the session
  }
}

// Run the demo
synthDemo().catch(console.error);
```

## Step 2: Run Your Synthesizer

```bash
node synthesizer.mjs
```

You'll hear a sequence of sounds demonstrating different waveforms, a simple melody, and volume control.

## Key Concepts Explained

### 1. Note-to-Frequency Conversion

```javascript
noteToFrequency(note, octave = 4) {
  const notes = { 'A': 0, 'B': 2, 'C': -9, /* ... */ };
  const semitone = notes[note];
  return 440 * Math.pow(2, (octave - 4) + semitone / 12);
}
```

This converts musical notes (like "A4" or "C5") to frequencies in Hz using the equal temperament tuning system.

### 2. Waveform Generation

Different waveforms create different timbres:

- **Sine wave**: Pure tone, smooth sound
- **Square wave**: Harsh, electronic sound
- **Sawtooth wave**: Bright, buzzy sound
- **Triangle wave**: Softer than square, warmer than sine

### 3. Generator Functions for Audio

```javascript
*generateWave(type, frequency, duration) {
  for (let i = 0; i < totalSamples; i += channels) {
    let sample = /* calculate waveform */;
    yield sample; // Left channel
    yield sample; // Right channel (stereo)
  }
}
```

Generator functions provide efficient streaming of audio samples without loading everything into memory at once.

## Step 3: Interactive Synthesizer

Let's make it interactive! Create `interactive-synth.mjs`:

```javascript
import { startSession, AudioQuality } from "pw-client";
import { createInterface } from "readline";

// ... (include the SimpleSynth class from above)

async function interactiveSynth() {
  const session = await startSession();
  const stream = await session.createAudioOutputStream({
    name: "Interactive Synthesizer",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();
  const synth = new SimpleSynth(stream);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let isQuitting = false;

  // Setup cleanup when the interface closes
  rl.on('close', async () => {
    if (isQuitting) return; // Prevent double cleanup
    isQuitting = true;

    console.log('\n🧹 Cleaning up...');
    try {
      await stream.dispose();
    } catch (error) {
      console.error('Error disposing stream:', error);
    }

    try {
      await session.dispose();
    } catch (error) {
      console.error('Error disposing session:', error);
    }

    console.log('👋 Goodbye!');
    process.exit(0);
  });

      console.log(`
🎹 Interactive Synthesizer Ready!

Commands:
  play <note> <octave> <duration> [waveform] - Play a note (e.g., "play A 4 1.0 sine")
  volume <level>                             - Set volume 0.0-1.0 (e.g., "volume 0.5")
  chord <note1> <note2> <note3> <duration>   - Play a chord (e.g., "chord C E G 2.0")
  quit                                       - Exit

Example: play C# 5 2.0 square
`);

      const askCommand = () => {
        rl.question("🎵 Enter command: ", async (input) => {
          const parts = input.trim().split(" ");
          const command = parts[0].toLowerCase();

          try {
            switch (command) {
              case "play":
                if (parts.length < 4) {
                  console.log(
                    "Usage: play <note> <octave> <duration> [waveform]"
                  );
                  break;
                }
                const [, note, octave, duration, waveform = "sine"] = parts;
                await synth.playNote(
                  note,
                  parseInt(octave),
                  parseFloat(duration),
                  waveform
                );
                break;

              case "volume":
                if (parts.length < 2) {
                  console.log("Usage: volume <level> (0.0-1.0)");
                  break;
                }
                synth.volume = Math.max(0, Math.min(1, parseFloat(parts[1])));
                console.log(`🔊 Volume set to ${synth.volume}`);
                break;

              case "chord":
                if (parts.length < 5) {
                  console.log(
                    "Usage: chord <note1> <note2> <note3> <duration>"
                  );
                  break;
                }
                const [, note1, note2, note3, chordDuration] = parts;
                // Play chord by mixing frequencies
                await synth.playChord(
                  [note1, note2, note3],
                  4,
                  parseFloat(chordDuration)
                );
                break;

              case "quit":
                rl.close();
                return;

              default:
                console.log('Unknown command. Type "quit" to exit.');
            }
          } catch (error) {
            console.error("Error:", error.message);
          }

          askCommand(); // Ask for next command
        });
      };

      askCommand();

      // Note: In a real interactive app, you'd want to handle cleanup
      // when the user exits. For this demo, cleanup happens when the process exits.
    } finally {
      await stream.dispose(); // Clean up the stream
    }
  } finally {
    await session.dispose(); // Clean up the session
  }
}

// Add chord method to SimpleSynth class
SimpleSynth.prototype.playChord = function (notes, octave, duration) {
  const frequencies = notes.map((note) => this.noteToFrequency(note, octave));

  const sampleRate = this.stream.rate;
  const channels = this.stream.channels;
  const totalSamples = Math.floor(duration * sampleRate * channels);

  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  function* generateChord() {
    for (let i = 0; i < totalSamples; i += channels) {
      // Mix all frequencies together
      let sample = 0;
      for (const freq of frequencies) {
        sample += Math.sin(phase * freq);
      }
      sample = (sample / frequencies.length) * this.volume; // Average and apply volume

      for (let ch = 0; ch < channels; ch++) {
        yield sample;
      }
      phase += cycle;
    }
  }

  console.log(`🎼 Playing chord: ${notes.join("-")}${octave} for ${duration}s`);
  return this.stream.write(generateChord.call(this));
};

interactiveSynth().catch(console.error);
```

## What You've Learned

- **Musical note to frequency conversion** using equal temperament
- **Waveform synthesis** for different timbres
- **Generator functions** for efficient audio streaming
- **Real-time audio control** with volume and timing
- **Interactive audio programming** with user input

## Next Steps

- **[Working with Stereo Audio](stereo-audio.md)** - Create spatial audio effects
- **[Generate Common Waveforms](../how-to-guides/generate-waveforms.md)** - More advanced synthesis techniques
- **[Mix Multiple Audio Sources](../how-to-guides/mix-audio-sources.md)** - Combine multiple synthesizers

## Exercises

Try these challenges to extend your synthesizer:

1. **Add envelope control** - Implement ADSR (Attack, Decay, Sustain, Release)
2. **Create vibrato effect** - Modulate frequency over time
3. **Add harmony** - Play multiple notes simultaneously
4. **Implement scales** - Create major/minor scale generators
