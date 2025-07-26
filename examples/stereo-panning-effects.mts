import { startSession, AudioQuality } from "pw-client";
import { setTimeout } from "node:timers/promises";

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Stereo Panning Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Linear panning law (simpler but flawed)
function linearPan(sample: number, panPosition: number): [number, number] {
  // panPosition: -1 = full left, 0 = center, +1 = full right
  const normalizedPan = (panPosition + 1) / 2; // Convert to 0-1 range
  const leftGain = 1 - normalizedPan;
  const rightGain = normalizedPan;

  return [sample * leftGain, sample * rightGain];
}

// Constant power panning law (recommended)
function constantPowerPan(
  sample: number,
  panPosition: number,
): [number, number] {
  // panPosition: -1 = full left, 0 = center, +1 = full right
  const normalizedPan = (panPosition + 1) / 2; // Convert to 0-1 range
  const angle = (normalizedPan * Math.PI) / 2; // 0 to π/2

  const leftGain = Math.cos(angle);
  const rightGain = Math.sin(angle);

  return [sample * leftGain, sample * rightGain];
}

// Static pan position example
function* pannedTone(frequency: number, duration: number, panPosition: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const sample = Math.sin(i * cycle * frequency) * 0.3;
    const [left, right] = constantPowerPan(sample, panPosition);

    yield left;
    yield right;
  }
}

console.log("🎵 Playing tone panned 75% to the right (2 seconds)...");
await stream.write(pannedTone(440, 2.0, 0.75));

await setTimeout(500);

// Oscillating pan position example
function* oscillatingPan(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Oscillating pan position from left to right
    const panPosition = Math.sin(t * 0.5); // Slow oscillation

    const [left, right] = constantPowerPan(sample, panPosition);

    yield left;
    yield right;
  }
}

console.log("🎵 Playing oscillating pan (3 seconds)...");
await stream.write(oscillatingPan(523, 3.0)); // C5 note
await setTimeout(500);

function* linearPanningDemo(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Oscillating pan position
    const panPos = Math.sin(t * 2); // -1 to +1

    // Use linear panning
    const [leftSample, rightSample] = linearPan(sample, panPos);

    yield leftSample;
    yield rightSample;
  }
}

function* constantPowerPanningDemo(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Oscillating pan position
    const panPos = Math.sin(t * 2); // -1 to +1

    // Use constant power panning
    const [leftSample, rightSample] = constantPowerPan(sample, panPos);

    yield leftSample;
    yield rightSample;
  }
}

console.log("🎵 Playing linear panning (notice volume dip in center)...");
await stream.write(linearPanningDemo(523, 3.0));

await setTimeout(500);

console.log("🎵 Playing constant power panning (consistent volume)...");
await stream.write(constantPowerPanningDemo(523, 3.0));

console.log("✅ Stereo panning effects demo complete!");
