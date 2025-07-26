import { startSession, AudioQuality } from "pw-client";
import { SimpleSynth } from "./simple-synth-class.mjs";

// SNIPSTART main-demo
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

// SNIPEND main-demo
