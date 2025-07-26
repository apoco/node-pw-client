import { startSession, AudioQuality } from "pw-client";
import { generateSineWave, generateNoise } from "./audio-utils.mjs";
import { AudioMixer } from "./audio-mixer.mjs";

// SNIPSTART simple-addition-mixing
function* mixAudioSources(
  ...generators: Array<Iterable<number, unknown, unknown>>
) {
  const iterators = generators.map((gen) => gen[Symbol.iterator]());

  while (true) {
    let mixedSample = 0;
    let activeCount = 0;

    // Get next sample from each source
    for (const iterator of iterators) {
      const { value, done } = iterator.next();
      if (!done) {
        mixedSample += value;
        activeCount++;
      }
    }

    // Stop when all sources are exhausted
    if (activeCount === 0) break;

    // Average to prevent clipping
    yield mixedSample / Math.max(1, activeCount);
  }
}
// SNIPEND simple-addition-mixing

// SNIPSTART weighted-mixing
function* mixWeighted(
  sources: Array<{
    generator: Iterable<number, unknown, unknown>;
    weight: number;
  }>
) {
  const iterators = sources.map(({ generator, weight }) => ({
    iterator: generator[Symbol.iterator](),
    weight,
  }));

  while (true) {
    let mixedSample = 0;
    let activeCount = 0;

    for (const { iterator, weight } of iterators) {
      const { value, done } = iterator.next();
      if (!done) {
        mixedSample += value * weight;
        activeCount++;
      }
    }

    if (activeCount === 0) break;
    yield mixedSample;
  }
}
// SNIPEND weighted-mixing

async function basicMixingDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Basic Audio Mixing",
      quality: AudioQuality.Standard,
      channels: 1,
    });

    try {
      await stream.connect();
      console.log(`🎵 Basic mixing demo @ ${stream.rate}Hz`);

      // Demo 1: Simple addition mixing
      console.log("\n🎼 Simple Addition Mixing");
      const tone440 = generateSineWave(440, 2.0, stream.rate);
      const tone880 = generateSineWave(880, 2.0, stream.rate);
      const noise = generateNoise(2.0, stream.rate);

      await stream.write(mixAudioSources(tone440, tone880, noise));
      console.log("✅ Played mixed audio (440Hz + 880Hz + noise)");

      // Demo 2: Weighted mixing (chord)
      console.log("\n🎚️ Weighted Mixing (C Major Chord)");
      const sources = [
        { generator: generateSineWave(523, 3.0, stream.rate), weight: 0.8 }, // C5 - loud
        { generator: generateSineWave(659, 3.0, stream.rate), weight: 0.5 }, // E5 - medium
        { generator: generateSineWave(784, 3.0, stream.rate), weight: 0.3 }, // G5 - quiet
      ];

      await stream.write(mixWeighted(sources));
      console.log("✅ Played weighted C major chord");

      console.log("\n✨ Basic mixing demo complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// SNIPSTART complete-mixing-example
async function completeMixingExample() {
  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: "Audio Mixing Demo",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();

  // Create audio sources
  function* kickDrum() {
    const duration = 0.1;
    const samples = Math.floor(duration * stream.rate);

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const env = Math.exp(-t * 8); // Exponential decay
      const osc = Math.sin(2 * Math.PI * 60 * t); // 60Hz kick
      yield osc * env * 0.8;
    }
  }

  function* sineWave(freq: number, duration: number) {
    const samples = Math.floor(duration * stream.rate);
    const cycle = (2 * Math.PI) / stream.rate;

    for (let i = 0; i < samples; i++) {
      yield Math.sin(i * cycle * freq) * 0.3;
    }
  }

  function* whiteNoise(duration: number) {
    const samples = Math.floor(duration * stream.rate);

    for (let i = 0; i < samples; i++) {
      yield (Math.random() * 2 - 1) * 0.1;
    }
  }

  // Create mixer and add tracks
  const mixer = new AudioMixer();

  mixer.addTrack(kickDrum(), { id: "kick", volume: 1.0, pan: 0 });
  mixer.addTrack(sineWave(440, 5), { id: "tone1", volume: 0.5, pan: -0.5 });
  mixer.addTrack(sineWave(550, 5), { id: "tone2", volume: 0.5, pan: 0.5 });
  mixer.addTrack(whiteNoise(5), { id: "noise", volume: 0.2, pan: 0 });

  console.log("🎛️ Playing mixed audio...");
  await stream.write(mixer.mix(stream.channels));

  console.log("✨ Mixing demo complete!");
}
// SNIPEND complete-mixing-example

// Run demos sequentially to avoid session conflicts
async function runAllDemos() {
  await basicMixingDemo();
  console.log("\n" + "=".repeat(50));
  console.log("🎛️ Complete Mixing Example");
  console.log("=".repeat(50));
  await completeMixingExample();
}

runAllDemos().catch(console.error);
