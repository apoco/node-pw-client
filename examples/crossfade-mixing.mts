import { startSession, AudioQuality } from "pw-client";
import { generateSineWave, generateSquareWave } from "./audio-utils.mjs";

function* crossfade(
  source1: Iterable<number>,
  source2: Iterable<number>,
  fadeLength: number,
) {
  const iter1 = source1[Symbol.iterator]();
  const iter2 = source2[Symbol.iterator]();

  let sampleCount = 0;

  while (true) {
    const result1 = iter1.next();
    const result2 = iter2.next();

    if (result1.done && result2.done) break;

    const sample1 = result1.done ? 0 : result1.value;
    const sample2 = result2.done ? 0 : result2.value;

    // Calculate crossfade ratio
    const fadeRatio = Math.min(1, sampleCount / fadeLength);
    const gain1 = Math.cos(fadeRatio * Math.PI * 0.5); // Smooth fade out
    const gain2 = Math.sin(fadeRatio * Math.PI * 0.5); // Smooth fade in

    yield sample1 * gain1 + sample2 * gain2;
    sampleCount++;
  }
}

async function crossfadeDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Crossfade Demo",
      quality: AudioQuality.Standard,
      channels: 1,
    });

    try {
      await stream.connect();
      console.log(`🌊 Crossfade demo @ ${stream.rate}Hz`);

      // Create two different waveforms
      const sineWave = generateSineWave(440, 4.0, stream.rate, 0.4);
      const squareWave = generateSquareWave(440, 4.0, stream.rate, 0.4);

      // Crossfade over 2 seconds
      const fadeLength = stream.rate * 2.0;

      console.log("🎵 Starting crossfade: sine wave → square wave");
      await stream.write(crossfade(sineWave, squareWave, fadeLength));
      console.log("✅ Crossfade complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// Run the demo
crossfadeDemo().catch(console.error);
