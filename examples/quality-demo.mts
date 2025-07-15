import { startSession, AudioQuality } from "../lib/index.mjs";

await using session = await startSession();

// Choose quality levels based on your application needs
// No need to worry about technical audio formats - work with JavaScript Numbers as usual

console.log("🎵 Available Audio Quality Levels:");
console.log(
  "  AudioQuality.High: Highest quality audio with maximum precision (best for music production)"
);
console.log(
  "  AudioQuality.Standard: Balanced quality and performance (recommended for most applications)"
);
console.log(
  "  AudioQuality.Efficient: Performance-optimized audio (best for voice and system sounds)"
);
console.log();

// Example 1: High quality for music production
await using streamHigh = await session.createAudioOutputStream({
  name: "High Quality Demo",
  quality: AudioQuality.High, // 🎯 Auto-negotiates best format AND rate!
  channels: 2,
  role: "Music",
});

// Example 2: Efficient quality for system sounds
await using streamEfficient = await session.createAudioOutputStream({
  name: "Efficient Demo",
  quality: AudioQuality.Efficient, // 🚀 Optimized for performance
  channels: 2,
  role: "Notification",
});

console.log("🔧 Quality Level Comparison:");

streamHigh.on("formatChange", (format) => {
  console.log(`📈 HIGH quality negotiated format: ${format.format}`);
});

streamEfficient.on("formatChange", (format) => {
  console.log(`⚡ EFFICIENT quality negotiated format: ${format.format}`);
});

// Connect both streams
await Promise.all([streamHigh.connect(), streamEfficient.connect()]);

// Generate some test audio - always work with JavaScript Numbers in range -1.0 to +1.0!
function* generateTestTone(
  frequency: number,
  duration: number,
  sampleRate: number,
  channels: number
): Generator<number> {
  const samples = Math.floor(duration * sampleRate * channels);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i += channels) {
    const sample = Math.sin(phase * frequency) * 0.1; // 10% volume (range: -0.1 to +0.1)
    for (let ch = 0; ch < channels; ch++) {
      yield sample; // Same sample for all channels
    }
    phase += cycle;
  }
}

console.log("\n🎵 Playing test tones...");

// Both streams use the same simple API - quality differences are handled automatically!
// Generate audio separately for each stream using their negotiated rates
const highQualityAudio = Array.from(
  generateTestTone(440, 1.0, streamHigh.rate, streamHigh.channels)
);
const efficientAudio = Array.from(
  generateTestTone(440, 1.0, streamEfficient.rate, streamEfficient.channels)
);

await Promise.all([
  streamHigh.write(highQualityAudio),
  streamEfficient.write(efficientAudio),
]);

await Promise.all([streamHigh.isFinished(), streamEfficient.isFinished()]);

await Promise.all([streamHigh.isFinished(), streamEfficient.isFinished()]);

console.log("\n📊 Final Comparison:");
console.log(
  `High Quality Stream: ${streamHigh.format.description} @ ${streamHigh.rate}Hz`
);
console.log(
  `Efficient Stream: ${streamEfficient.format.description} @ ${streamEfficient.rate}Hz`
);
console.log("\n✨ Key Benefits of Quality-Based API:");
console.log("• No need to understand technical audio formats");
console.log("• Always work with JavaScript Numbers (Float64)");
console.log("• Automatic format negotiation based on use case");
console.log("• Quality levels that match real user needs");
