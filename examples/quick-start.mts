import { startSession } from "pw-client";

// Create processing thread for PipeWire
const session = await startSession();

try {
  // Create audio stream
  const stream = await session.createAudioOutputStream({
    name: "My Audio App",
    channels: 2, // Stereo output
  });

  try {
    await stream.connect();

    // Generate PCM audio samples
    function* generateTone(frequency: number, duration: number) {
      const totalSamples = duration * stream.rate * stream.channels;
      const cycle = (Math.PI * 2) / stream.rate;
      let phase = 0;

      for (let i = 0; i < totalSamples; i += stream.channels) {
        const sample = Math.sin(phase * frequency) * 0.2; // 20% volume

        // Output to both stereo channels
        for (let ch = 0; ch < stream.channels; ch++) {
          yield sample;
        }
        phase += cycle;
      }
    }

    // Play 2-second A4 note
    await stream.write(generateTone(440, 2.0));
  } finally {
    await stream.dispose(); // Clean up stream
  }
} finally {
  await session.dispose(); // Clean up session
}

console.log("🎵 Quick start demo complete!");
