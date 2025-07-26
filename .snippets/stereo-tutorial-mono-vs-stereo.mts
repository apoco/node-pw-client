import { startSession, AudioQuality } from "pw-client";

console.log("🎵 Stereo Audio Tutorial: Mono vs Stereo Comparison");

// SNIPSTART mono-setup
// First, create a mono stream
await using session = await startSession();
await using monoStream = await session.createAudioOutputStream({
  name: "Mono Demo",
  quality: AudioQuality.Standard,
  channels: 1, // Mono - single channel
  role: "Music",
});

await monoStream.connect();

// Simple mono tone generator
function* monoTone(frequency: number, duration: number) {
  const totalSamples = duration * monoStream.rate;
  const cycle = (Math.PI * 2) / monoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    yield Math.sin(i * cycle * frequency) * 0.3;
  }
}

console.log("🎵 Playing mono tone...");
await monoStream.write(monoTone(440, 2.0));
// SNIPEND mono-setup

// SNIPSTART stereo-setup
// Create a stereo stream
await using stereoStream = await session.createAudioOutputStream({
  name: "Stereo Demo",
  quality: AudioQuality.Standard,
  channels: 2, // Stereo - two channels
  role: "Music",
});

await stereoStream.connect();

// Stereo tone generator - same signal in both channels
function* stereoTone(frequency: number, duration: number) {
  const totalSamples = duration * stereoStream.rate;
  const cycle = (Math.PI * 2) / stereoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    yield sample; // Left channel
    yield sample; // Right channel (same as left)
  }
}

console.log("🎵 Playing stereo tone (same in both channels)...");
await stereoStream.write(stereoTone(440, 2.0));
// SNIPEND stereo-setup

console.log("✨ Mono vs Stereo comparison complete!");
