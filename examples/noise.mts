import { startSession, AudioQuality } from "../lib/index.mjs";

await using session = await startSession();

await using stream = await session.createAudioOutputStream({
  name: "Stereo Noise Demo",
  quality: AudioQuality.Standard, // Good balance for demos - auto-negotiates rate!
  channels: 2, // Stereo for proper playback in both ears
  role: "Music", // For proper audio routing
});

stream.on("formatChange", (format) => {
  console.log(
    `🎵 Quality: ${AudioQuality.Standard} → Format: ${format.format.description} @ ${format.rate}Hz`
  );
});

await stream.connect();

await stream.write(
  (function* sampleStream() {
    // Use negotiated stream properties
    for (
      let i = 0;
      i < 4 * stream.rate * stream.channels;
      i += stream.channels
    ) {
      // Generate random noise for each channel
      for (let ch = 0; ch < stream.channels; ch++) {
        const sample = (Math.random() - 0.5) * 0.5; // Range: -0.25 to +0.25 (50% volume)
        yield sample;
      }
    }
  })()
);
