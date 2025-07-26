import { startSession, AudioQuality } from "pw-client";

console.log("🎵 Stereo Audio Tutorial: Complete Learning Demo");

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Stereo Learning Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Demonstration generator that shows multiple concepts
function* stereoDemo() {
  const sampleRate = stream.rate;
  const cycleFactor = (Math.PI * 2) / sampleRate;

  // 1. Same tone in both channels (2 seconds)
  console.log("1. Same tone in both channels...");
  for (let i = 0; i < sampleRate * 2; i++) {
    const sample = Math.sin(i * cycleFactor * 440) * 0.3;
    yield sample; // Left
    yield sample; // Right
  }

  // 2. Different tones per channel (2 seconds)
  console.log("2. Different tones per channel...");
  for (let i = 0; i < sampleRate * 2; i++) {
    const leftSample = Math.sin(i * cycleFactor * 440) * 0.3; // A4
    const rightSample = Math.sin(i * cycleFactor * 523) * 0.3; // C5
    yield leftSample;
    yield rightSample;
  }

  // 3. Simple panning effect (3 seconds)
  console.log("3. Panning effect...");
  const panDuration = 3;
  for (let i = 0; i < sampleRate * panDuration; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(i * cycleFactor * 660) * 0.3; // E5

    // Pan from left to right
    const panPos = (t / panDuration) * 2 - 1; // -1 to +1
    const leftGain = Math.max(0, 1 - (panPos + 1) / 2);
    const rightGain = Math.max(0, (panPos + 1) / 2);

    yield sample * leftGain;
    yield sample * rightGain;
  }
}

await stream.write(stereoDemo());
console.log("✨ Stereo demo complete!");
