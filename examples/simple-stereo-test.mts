import { startSession } from "../lib/index.mjs";

console.log("🔍 Simple Stereo Buffer Test");

await using session = await startSession();

const rate = 48_000;

await using stream = await session.createAudioOutputStream({
  name: "Simple Stereo Test",
  rate,
  channels: 2,
  role: "Music",
});

stream.on("formatChange", (format) => {
  console.log(
    `🎵 Format: ${format.format} @ ${format.rate}Hz, ${format.channels} channels`
  );
});

stream.on("stateChange", (state) => console.log(`🔄 State: ${state}`));

await stream.connect();

console.log("🎵 Playing simple 440Hz stereo tone...");

// Generate a very simple 440Hz tone for both channels (should sound smooth)
function* generateSimpleStereoTone(duration: number) {
  const totalSamples = Math.floor(duration * rate);

  console.log(
    `Generating ${totalSamples} frames (${totalSamples * 2} samples)`
  );

  for (let i = 0; i < totalSamples; i++) {
    const t = i / rate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.3;

    // Left channel
    yield sample;
    // Right channel
    yield sample;
  }
}

const audioData = generateSimpleStereoTone(2.0); // 2 seconds

await stream.write(audioData);

console.log("⏳ Waiting for completion...");
await stream.isFinished();

console.log("✅ Test complete!");
