import { startSession, AudioQuality } from "pw-client";

console.log("⏱️ Haas Effect (Precedence Effect) Demo");

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Haas Effect Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Haas effect (short delay for stereo width)
function* haasEffect(frequency: number, duration: number, delayMs = 15) {
  const totalSamples = duration * stream.rate;
  const delaySamples = Math.floor((delayMs / 1000) * stream.rate);
  const cycle = (Math.PI * 2) / stream.rate;

  // Buffer for delay
  const delayBuffer = new Array<number>(delaySamples).fill(0);
  let bufferIndex = 0;

  for (let i = 0; i < totalSamples; i++) {
    const currentSample = Math.sin(i * cycle * frequency) * 0.3;

    // Left channel: direct signal
    const leftSample = currentSample;

    // Right channel: delayed signal
    const rightSample = delayBuffer[bufferIndex];
    delayBuffer[bufferIndex] = currentSample;
    bufferIndex = (bufferIndex + 1) % delaySamples;

    yield leftSample;
    yield rightSample;
  }
}

console.log("🎵 Playing Haas effect with 15ms delay (4 seconds)...");
console.log("    Creates stereo width without affecting localization");
await stream.write(haasEffect(330, 4.0, 15));

console.log("✅ Haas effect demo complete!");
