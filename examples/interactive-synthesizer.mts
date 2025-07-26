import { startSession, AudioQuality } from "pw-client";
import { createInterface } from "readline/promises";

// Import the SimpleSynth class from the class module
import { SimpleSynth } from "./simple-synth-class.mjs";

async function interactiveSynth() {
  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: "Interactive Synthesizer",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();

  // Wait for the interactive loop to complete before exiting
  await interactiveLoop(new SimpleSynth(stream));
}

async function interactiveLoop(synth: SimpleSynth): Promise<void> {
  console.log(`
🎹 Interactive Synthesizer Ready!

Commands:
  play <note> <octave> <duration> [waveform] - Play a note (e.g., "play A 4 1.0 sine")
  volume <level>                             - Set volume 0.0-1.0 (e.g., "volume 0.5")
  chord <note1> <note2> <note3> <duration>   - Play a chord (e.g., "chord C E G 2.0")
  quit                                       - Exit

Example: play C# 5 2.0 square
`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let keepAsking = true;

  process.on("SIGINT", () => {
    console.log("\n🛑 Interrupt received");
    rl.close();
    keepAsking = false;
  });

  try {
    while (keepAsking) {
      const input = await rl.question("🎵 Enter command: ");
      keepAsking = await handleCommand(input, synth);
    }
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      err.name !== "AbortError"
    ) {
      throw err;
    }
  }

  rl.close();
}

async function handleCommand(
  input: string,
  synth: SimpleSynth,
): Promise<boolean> {
  const parts = input.trim().split(" ");
  const command = parts[0].toLowerCase();

  switch (command) {
    case "play":
      await playNote(synth, parts);
      break;
    case "volume":
      setVolume(synth, parts);
      break;
    case "chord":
      await playChord(synth, parts);
      break;
    case "quit":
      return false;
    default:
      console.log('Unknown command. Type "quit" to exit.');
  }

  return true; // Continue asking for commands
}

async function playNote(synth: SimpleSynth, parts: Array<string>) {
  if (parts.length < 4) {
    console.log("Usage: play <note> <octave> <duration> [waveform]");
    return;
  }
  const [, note, octave, duration, waveform = "sine"] = parts;
  await synth.playNote(note, parseInt(octave), parseFloat(duration), waveform);
}

function setVolume(synth: SimpleSynth, parts: Array<string>) {
  if (parts.length < 2) {
    console.log("Usage: volume <level> (0.0-1.0)");
    return;
  }
  synth.volume = Math.max(0, Math.min(1, parseFloat(parts[1])));
  console.log(`🔊 Volume set to ${synth.volume}`);
}

async function playChord(synth: SimpleSynth, parts: Array<string>) {
  if (parts.length < 5) {
    console.log("Usage: chord <note1> <note2> <note3> <duration>");
    return;
  }
  const [, note1, note2, note3, chordDuration] = parts;
  await synth.playChord([note1, note2, note3], 4, parseFloat(chordDuration));
}

// Run the interactive synthesizer
interactiveSynth().catch(console.error);
