import { startSession, AudioQuality } from "pw-client";

await using session = await startSession();

const rate = 48_000;

await using stream = await session.createAudioOutputStream({
  name: "Sample Range Demo",
  quality: AudioQuality.Standard,
  rate,
  channels: 2,
});

stream.on("formatChange", (format) => {
  console.log(
    `🎵 Format: ${JSON.stringify(format.format)} @ ${format.rate}Hz, ${format.channels} channels`
  );
});

await stream.connect();

console.log("🎯 Audio Sample Range Demo");
console.log("📏 Valid sample range: -1.0 to +1.0");
console.log();

// Demo 1: Different volume levels
console.log("🔊 Playing tones at different volume levels...");

function* generateTone(frequency: number, volume: number, duration: number) {
  const samples = Math.floor(duration * rate * 2); // stereo
  const cycle = (Math.PI * 2) / rate;
  let phase = 0;

  console.log(
    `   ${frequency}Hz at ${Math.round(volume * 100)}% volume (range: ${(-volume).toFixed(2)} to +${volume.toFixed(2)})`
  );

  for (let i = 0; i < samples; i += 2) {
    const sample = Math.sin(phase * frequency) * volume; // Scale amplitude by volume
    yield sample; // Left channel
    yield sample; // Right channel
    phase += cycle;
  }
}

// Play tones at different volumes to demonstrate the range
const volumes = [0.1, 0.3, 0.5, 0.7, 0.9]; // 10% to 90% volume
for (const volume of volumes) {
  await stream.write(generateTone(440, volume, 0.5)); // 0.5 second each
}

console.log();
console.log("✅ All samples were in valid range -1.0 to +1.0");
console.log();

// Demo 2: Show what happens with different waveforms
console.log("🌊 Playing different waveforms (all at 20% volume)...");

function* generateWaveform(
  waveType: string,
  frequency: number,
  volume: number,
  duration: number
) {
  const samples = Math.floor(duration * rate * 2);
  const cycle = (Math.PI * 2) / rate;
  let phase = 0;

  console.log(`   ${waveType} wave at ${frequency}Hz`);

  for (let i = 0; i < samples; i += 2) {
    let sample: number;

    switch (waveType) {
      case "sine":
        sample = Math.sin(phase * frequency);
        break;
      case "square":
        sample = Math.sin(phase * frequency) > 0 ? 1 : -1;
        break;
      case "triangle":
        sample = (2 / Math.PI) * Math.asin(Math.sin(phase * frequency));
        break;
      case "sawtooth":
        sample = (2 / Math.PI) * Math.atan(Math.tan((phase * frequency) / 2));
        break;
      default:
        sample = 0;
    }

    sample *= volume; // Scale to safe volume level

    yield sample; // Left channel
    yield sample; // Right channel
    phase += cycle;
  }
}

const waveforms = ["sine", "square", "triangle", "sawtooth"];
for (const waveform of waveforms) {
  await stream.write(generateWaveform(waveform, 220, 0.2, 0.8)); // 0.8 seconds each
}

console.log();
console.log("📋 Key Takeaways:");
console.log("• Always use signed floating-point values: -1.0 to +1.0");
console.log("• 0.0 = silence, ±1.0 = maximum safe amplitude");
console.log("• Volume control = multiply by fraction (0.1 = 10% volume)");
console.log("• Values outside ±1.0 will be clipped (causing distortion)");
console.log(
  "• Use lower volumes when mixing multiple sources to prevent clipping"
);

await stream.isFinished();
