console.log("📚 Stereo Audio Concepts Demonstration");

// SNIPSTART sample-ordering-correct
// ✅ Correct: alternating left/right
function* correctStereoOrdering(totalSamples: number) {
  function generateSample(i: number) {
    return Math.sin(i * 0.01) * 0.3; // Simple sine wave
  }

  for (let i = 0; i < totalSamples; i++) {
    const sample = generateSample(i);
    const leftGain = 0.5;
    const rightGain = 0.5;

    yield sample * leftGain; // Left channel first
    yield sample * rightGain; // Right channel second
  }
}
// SNIPEND sample-ordering-correct

// SNIPSTART sample-ordering-explanation
// ❌ Wrong: grouped by channel
// for (let i = 0; i < totalSamples; i++) {
//   const sample = generateSample(i);
//   leftSamples.push(sample * leftGain);
//   rightSamples.push(sample * rightGain);
// }
// Don't do this - PipeWire expects interleaved samples
// SNIPEND sample-ordering-explanation

// SNIPSTART channel-count-calculation
const durationSeconds = 2.0;
const sampleRate = 48000;

// Mono (channels: 1)
const monoSampleCount = durationSeconds * sampleRate; // 96,000 samples

// Stereo (channels: 2)
const stereoSampleCount = durationSeconds * sampleRate * 2; // 192,000 samples
//                                                       ↑
//                                              Must yield 2x as many!

console.log(`Mono samples needed: ${monoSampleCount}`);
console.log(`Stereo samples needed: ${stereoSampleCount}`);
// SNIPEND channel-count-calculation

// Demonstrate the correct ordering
console.log("✅ Testing correct stereo sample ordering...");
const samples = Array.from(correctStereoOrdering(10)); // Get first 10 samples
console.log("First 10 samples (L/R interleaved):", samples);

console.log("✨ Concepts demonstration complete!");
