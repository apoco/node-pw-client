import { startSession, AudioQuality } from "pw-client";

console.log("🎵 Stereo Audio Tutorial: Independent Channels");

await using session = await startSession();
await using stereoStream = await session.createAudioOutputStream({
  name: "Independent Channels Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stereoStream.connect();

// Generator with different content per channel
function* independentChannels(duration: number) {
  const totalSamples = duration * stereoStream.rate;
  const cycle = (Math.PI * 2) / stereoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    // Left channel: 440Hz (A4)
    const leftSample = Math.sin(i * cycle * 440) * 0.3;

    // Right channel: 660Hz (E5)
    const rightSample = Math.sin(i * cycle * 660) * 0.3;

    yield leftSample; // Left channel
    yield rightSample; // Right channel
  }
}

console.log("🎵 Playing independent channels (Left: 440Hz, Right: 660Hz)...");
console.log("    Use headphones to hear the difference clearly!");
await stereoStream.write(independentChannels(3.0));

console.log("✨ Independent channels demo complete!");
