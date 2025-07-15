import {
  startSession,
  AudioQuality,
  AudioOutputStream,
} from "../lib/index.mjs";

await using session = await startSession();

console.log("🎵 Rate Negotiation Demo: Quality-based Sample Rate Selection");
console.log();

// Examples showing how quality levels now influence BOTH format AND rate negotiation
const examples = [
  {
    name: "High Quality Audio",
    quality: AudioQuality.High,
    description: "Prefers high sample rates for audiophile applications",
    role: "Music" as const,
  },
  {
    name: "Standard Quality Audio",
    quality: AudioQuality.Standard,
    description: "Balanced approach with professional 48kHz preference",
    role: "Game" as const,
  },
  {
    name: "Efficient Audio",
    quality: AudioQuality.Efficient,
    description: "Optimized for performance, prefers CD quality 44.1kHz",
    role: "Notification" as const,
  },
];

const streams: AudioOutputStream[] = [];

for (const example of examples) {
  console.log(`📊 Creating ${example.name} stream...`);
  console.log(`   Description: ${example.description}`);

  const stream = await session.createAudioOutputStream({
    name: `Rate Demo: ${example.name}`,
    quality: example.quality, // 🎯 This now affects BOTH format AND rate negotiation!
    channels: 2,
    role: example.role,
  });

  stream.on("formatChange", (format) => {
    console.log(
      `   ✅ Negotiated: ${format.format.description} @ ${format.rate}Hz`
    );
  });

  streams.push(stream);
}

console.log("\n🔗 Connecting streams to see negotiated rates...");
await Promise.all(streams.map((stream) => stream.connect()));

console.log("\n📈 Rate Negotiation Results:");
for (let i = 0; i < streams.length; i++) {
  const stream = streams[i];
  const example = examples[i];
  console.log(`${example.name}:`);
  console.log(`  Format: ${stream.format.description}`);
  console.log(`  Rate: ${stream.rate}Hz`);
  console.log(`  Channels: ${stream.channels}`);
  console.log();
}

// Generate test audio to demonstrate the different rates working
console.log("🎵 Playing test tones on all streams...");

function* generateTone(
  frequency: number,
  duration: number,
  sampleRate: number,
  channels: number
) {
  const samples = Math.floor(duration * sampleRate * channels);
  const cycle = (Math.PI * 2) / sampleRate;
  let phase = 0;

  for (let i = 0; i < samples; i += channels) {
    const sample = Math.sin(phase * frequency) * 0.1; // 10% volume
    for (let ch = 0; ch < channels; ch++) {
      yield sample;
    }
    phase += cycle;
  }
}

// Each stream generates audio at its negotiated sample rate
const audioPromises = streams.map((stream, i) => {
  const frequency = 440 + i * 110; // Different frequencies for each stream
  const audio = Array.from(
    generateTone(frequency, 0.5, stream.rate, stream.channels)
  );
  return stream.write(audio);
});

await Promise.all(audioPromises);
await Promise.all(streams.map((stream) => stream.isFinished()));

// Properly dispose of all streams
console.log("🧹 Cleaning up streams...");
await Promise.all(streams.map((stream) => stream[Symbol.asyncDispose]()));

console.log("✨ Rate Negotiation Benefits:");
console.log(
  "• Quality levels now control both format AND sample rate preferences"
);
console.log(
  "• High quality automatically prefers high sample rates when available"
);
console.log(
  "• Efficient quality optimizes for performance with standard rates"
);
console.log("• Manual override still possible with preferredRates option");
console.log("• Seamless negotiation with audio device capabilities");
