import { startSession, AudioQuality } from "pw-client";
import { setTimeout } from "node:timers/promises";

// SNIPSTART mid-side-processing-demo
console.log("🔄 Mid/Side Processing Demo");

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Mid/Side Processing Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Mid/Side encoding: convert L/R to M/S
function encodeMS(left: number, right: number): [number, number] {
  const mid = (left + right) / 2; // Sum (mono content)
  const side = (left - right) / 2; // Difference (stereo content)
  return [mid, side];
}

// Mid/Side decoding: convert M/S back to L/R
function decodeMS(mid: number, side: number): [number, number] {
  const left = mid + side;
  const right = mid - side;
  return [left, right];
}

function* midSideProcessing(
  frequency: number,
  duration: number,
  stereoWidth = 1.0
) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;

    // Create initial stereo signal
    const baseSignal = Math.sin(i * cycle * frequency) * 0.3;
    const modulation = Math.sin(t * 4) * 0.1; // Slow modulation

    let left = baseSignal + modulation;
    let right = baseSignal - modulation;

    // Encode to Mid/Side
    const [mid, sideSignal] = encodeMS(left, right);

    // Process: adjust stereo width by scaling the Side signal
    const side = sideSignal * stereoWidth;

    // Decode back to L/R
    [left, right] = decodeMS(mid, side);

    yield left;
    yield right;
  }
}

console.log("🎵 Normal stereo width (2 seconds)...");
await stream.write(midSideProcessing(349, 2.0, 1.0)); // F4
await setTimeout(300);

console.log("🎵 Wide stereo effect (2 seconds)...");
await stream.write(midSideProcessing(349, 2.0, 2.0)); // Enhanced width
await setTimeout(300);

console.log("🎵 Narrow stereo - more mono (2 seconds)...");
await stream.write(midSideProcessing(349, 2.0, 0.3)); // Reduced width
// SNIPEND mid-side-processing-demo

console.log("✅ Mid/Side processing demo complete!");
