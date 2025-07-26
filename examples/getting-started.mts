import { startSession, AudioQuality } from "pw-client";

async function playTone() {
  // Create a PipeWire session
  const session = await startSession();

  try {
    console.log("✅ Connected to PipeWire");

    // Create an audio output stream
    const stream = await session.createAudioOutputStream({
      name: "My First Audio App", // Friendly name for PipeWire
      quality: AudioQuality.Standard, // Good balance of quality/performance
      channels: 2, // Stereo output
    });

    try {
      // Connect to the audio system
      await stream.connect();
      console.log(
        `🔊 Stream connected: ${stream.format.description} @ ${stream.rate}Hz`,
      );

      // Generate a simple tone
      function* generateTone(frequency: number, duration: number) {
        const totalSamples = Math.floor(
          duration * stream.rate * stream.channels,
        );
        const cycle = (Math.PI * 2) / stream.rate;
        let phase = 0;

        for (let i = 0; i < totalSamples; i += stream.channels) {
          // Create the sine wave sample (range: -1.0 to +1.0)
          const sample = Math.sin(phase * frequency) * 0.2; // 20% volume

          // Output to both stereo channels
          yield sample; // Left channel
          yield sample; // Right channel

          phase += cycle;
        }
      }

      // Play the tone
      console.log("🎵 Playing 440Hz tone for 2 seconds...");
      await stream.write(generateTone(440, 2.0)); // A4 note for 2 seconds

      console.log("✨ Done!");
    } finally {
      // Clean up the stream
      await stream.dispose();
    }
  } finally {
    // Clean up the session
    await session.dispose();
  }
}

// Run the program
playTone().catch(console.error);
