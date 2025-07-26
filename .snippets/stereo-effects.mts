import { startSession, AudioQuality } from "pw-client";
import { setTimeout } from "node:timers/promises";

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Channel Demo",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});

await stream.connect();

// Utility function for spatial audio
function constantPowerPan(
  sample: number,
  panPosition: number
): [number, number] {
  // panPosition: -1 = full left, 0 = center, +1 = full right
  const normalizedPan = (panPosition + 1) / 2; // Convert to 0-1 range
  const angle = (normalizedPan * Math.PI) / 2; // 0 to π/2

  const leftGain = Math.cos(angle);
  const rightGain = Math.sin(angle);

  return [sample * leftGain, sample * rightGain];
}

// SNIPSTART spatial-audio-games
console.log("🎮 Spatial Audio for Games Demo");

// Position sounds in 3D space
function spatialPan(
  sample: number,
  listenerX: number,
  listenerY: number,
  sourceX: number,
  sourceY: number
): [number, number] {
  // Calculate relative position
  const deltaX = sourceX - listenerX;
  const deltaY = sourceY - listenerY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // Calculate pan based on horizontal position
  const panPosition = Math.max(-1, Math.min(1, deltaX / 10)); // Normalize to -1..1

  // Apply distance attenuation
  const attenuation = 1 / (1 + distance * 0.1);
  const attenuatedSample = sample * attenuation;

  return constantPowerPan(attenuatedSample, panPosition);
}

// Demonstrate spatial audio by moving a sound source around the listener
function* spatialAudioDemo(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate;
  const cycle = (Math.PI * 2) / stream.rate;

  // Listener is at origin (0, 0)
  const listenerX = 0;
  const listenerY = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / stream.rate;
    const sample = Math.sin(i * cycle * frequency) * 0.3;

    // Source moves in a circle around the listener
    const radius = 5;
    const sourceX = Math.cos(t * 2) * radius; // Move in X
    const sourceY = Math.sin(t * 2) * radius; // Move in Y

    const [leftSample, rightSample] = spatialPan(
      sample,
      listenerX,
      listenerY,
      sourceX,
      sourceY
    );

    yield leftSample;
    yield rightSample;
  }
}

console.log("🎵 Playing spatial audio demo (sound moving in circle)...");
await stream.write(spatialAudioDemo(440, 4.0));
// SNIPEND spatial-audio-games

await setTimeout(500);

// SNIPSTART stereo-delay-effects
console.log("🔄 Stereo Delay Effects Demo");

// Create stereo delay effects with different delay times for each channel
function* stereoDelay(
  input: Iterable<number>,
  leftDelayMs: number,
  rightDelayMs: number,
  feedback = 0.3,
  wet = 0.5
) {
  const leftDelaySamples = Math.floor((leftDelayMs / 1000) * stream.rate);
  const rightDelaySamples = Math.floor((rightDelayMs / 1000) * stream.rate);

  const leftBuffer = new Array<number>(leftDelaySamples).fill(0);
  const rightBuffer = new Array<number>(rightDelaySamples).fill(0);

  let leftIndex = 0;
  let rightIndex = 0;
  let isLeft = true;

  for (const sample of input) {
    if (isLeft) {
      // Process left channel
      const delayed = leftBuffer[leftIndex];
      const output = sample * (1 - wet) + delayed * wet;

      leftBuffer[leftIndex] = sample + delayed * feedback;
      leftIndex = (leftIndex + 1) % leftDelaySamples;

      yield output;
    } else {
      // Process right channel
      const delayed = rightBuffer[rightIndex];
      const output = sample * (1 - wet) + delayed * wet;

      rightBuffer[rightIndex] = sample + delayed * feedback;
      rightIndex = (rightIndex + 1) % rightDelaySamples;

      yield output;
    }

    isLeft = !isLeft;
  }
}

// Apply stereo delay to a tone
function* sourceTone(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate * 2; // Stereo
  const cycle = (Math.PI * 2) / stream.rate;

  for (let i = 0; i < totalSamples; i += 2) {
    const sample = Math.sin((i / 2) * cycle * frequency) * 0.3;
    yield sample; // Left
    yield sample; // Right
  }
}

console.log("🎵 Playing stereo delay effect...");
await stream.write(
  stereoDelay(
    sourceTone(440, 3.0),
    250, // Left delay: 250ms
    380, // Right delay: 380ms
    0.4, // Feedback
    0.6 // Wet mix
  )
);
// SNIPEND stereo-delay-effects

console.log("✅ Channel interleaving and panning mathematics demo complete!");
