import { startSession } from "../lib/index.mjs";

console.log("🎵 Unified PipeWire Audio Stream Example");

await using session = await startSession();

const rate = 48_000;

// Create an audio stream - format negotiation happens automatically!
// JavaScript developers can always work with Float64 numbers
await using stream = await session.createAudioOutputStream({
  name: "Unified Audio Demo",
  rate,
  channels: 2, // Stereo
  role: "Music",
});

stream.on("stateChange", (state) => console.log(`🔄 State: ${state}`));
stream.on("formatChange", (format) => {
  console.log(
    `� Format negotiated: ${format.format} @ ${format.rate}Hz, ${format.channels} channels`
  );
});
stream.on("error", (err) => console.error("❌ Error:", err));

await stream.connect();

console.log("🎼 Generating audio...");

// Generate some test audio - always work with JavaScript Number (Float64)
function* generateStereoTone(
  leftFreq: number,
  rightFreq: number,
  duration: number
) {
  const samples = Math.floor(duration * stream.rate);
  for (let i = 0; i < samples; i++) {
    const t = i / stream.rate;

    // Left channel
    yield Math.sin(2 * Math.PI * leftFreq * t) * 0.3;

    // Right channel
    yield Math.sin(2 * Math.PI * rightFreq * t) * 0.3;
  }
}

function* generateSilence(duration: number) {
  const samples = Math.floor(duration * stream.rate * stream.channels);
  for (let i = 0; i < samples; i++) {
    yield 0;
  }
}

function* concatenate(...generators: Array<Iterable<number>>) {
  for (const gen of generators) {
    yield* gen;
  }
}

// Create a simple stereo demo: left ear 440Hz, right ear 880Hz
const audioSequence = concatenate(
  generateStereoTone(440, 880, 1.0), // A4 left, A5 right
  generateSilence(0.2),
  generateStereoTone(523.25, 1046.5, 1.0), // C5 left, C6 right
  generateSilence(0.2),
  generateStereoTone(659.25, 1318.5, 1.0) // E5 left, E6 right
);

console.log("🎵 Playing stereo audio sequence...");

// Write samples - automatic format conversion happens internally
await stream.write(audioSequence);

console.log("⏳ Waiting for playback to complete...");
await stream.isFinished();

// Get final stream information
console.log(`\n📊 Final stream info:`);
console.log(`   Requested: Float64 (JavaScript Number) @ ${rate}Hz`);
console.log(`   Hardware:  ${stream.format.description} @ ${stream.rate}Hz`);
console.log(`   Result:    Automatic conversion handled transparently`);

console.log("\n✅ Demo complete!");
console.log("\n💡 Key benefits:");
console.log("   • Always work with JavaScript Number (Float64) in your code");
console.log("   • Automatic format negotiation with hardware");
console.log("   • Transparent sample conversion when needed");
console.log("   • No need to worry about hardware format compatibility!");
