import { startSession, AudioQuality } from "pw-client";

console.log("🎵 Stereo Audio Tutorial: Simple Panning Effect");

await using session = await startSession();
await using stereoStream = await session.createAudioOutputStream({
  name: "Simple Panning Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stereoStream.connect();

function* simplePanning(frequency: number, duration: number) {
  const totalSamples = duration * stereoStream.rate;
  const cycle = (Math.PI * 2) / stereoStream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stereoStream.rate; // Current time in seconds
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Calculate pan position: starts at -1 (left), ends at +1 (right)
    const panPosition = (t / duration) * 2 - 1; // -1 to +1 over duration

    // Simple linear panning (we'll learn better methods later)
    const leftGain = Math.max(0, 1 - (panPosition + 1) / 2); // 1 to 0
    const rightGain = Math.max(0, (panPosition + 1) / 2); // 0 to 1

    yield sample * leftGain; // Left channel
    yield sample * rightGain; // Right channel
  }
}

console.log("🎵 Playing panning tone (moves left to right)...");
await stereoStream.write(simplePanning(523, 4.0)); // C5 note

console.log("✨ Simple panning demo complete!");
