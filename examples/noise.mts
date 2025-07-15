import { startSession, AudioQuality } from "../lib/index.mjs";

await using session = await startSession();

const rate = 48_000;
await using stream = await session.createAudioOutputStream({
  name: "Stereo Noise Demo",
  quality: AudioQuality.Standard, // Good balance for demos
  rate,
  channels: 2, // Stereo for proper playback in both ears
  role: "Music", // For proper audio routing
});

stream.on("formatChange", (format) => {
  console.log(
    `🎵 Quality: ${AudioQuality.Standard} → Format: ${format.format}`
  );
});

await stream.connect();

await stream.write(
  (function* sampleStream() {
    for (let i = 0; i < 4 * rate * 2; i += 2) {
      // *2 for stereo duration
      // Generate random noise in range -0.5 to +0.5 (50% volume to be gentle on ears)
      const leftSample = (Math.random() - 0.5) * 0.5; // Range: -0.25 to +0.25
      const rightSample = (Math.random() - 0.5) * 0.5; // Range: -0.25 to +0.25
      yield leftSample; // Left channel
      yield rightSample; // Right channel
    }
  })()
);
