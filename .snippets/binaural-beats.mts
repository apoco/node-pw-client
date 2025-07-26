import { startSession, AudioQuality } from "pw-client";

// SNIPSTART binaural-beats-demo
console.log("🧠 Binaural Beats Demo");

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Binaural Beats Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Binaural beats effect (slightly different frequencies in each ear)
function* binauralBeats(baseFreq: number, beatFreq: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const leftFreq = baseFreq;
    const rightFreq = baseFreq + beatFreq; // Creates beating effect

    const leftSample = Math.sin(i * cycle * leftFreq) * 0.2;
    const rightSample = Math.sin(i * cycle * rightFreq) * 0.2;

    yield leftSample; // Left channel
    yield rightSample; // Right channel
  }
}

console.log("🎵 Playing binaural beats (8Hz beat frequency, 4 seconds)...");
console.log("    Use headphones for best effect!");
await stream.write(binauralBeats(200, 8, 4.0));
// SNIPEND binaural-beats-demo

console.log("✅ Binaural beats demo complete!");
