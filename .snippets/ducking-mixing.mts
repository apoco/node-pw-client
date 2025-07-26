import { startSession, AudioQuality } from "pw-client";
import { generateSineWave } from "./audio-utils.mjs";

// SNIPSTART ducking-mixing
function* duckingMix(
  foreground: Iterable<number, unknown, unknown>,
  background: Iterable<number, unknown, unknown>,
  threshold = 0.1,
  duckRatio = 0.3
) {
  const foregroundIter = foreground[Symbol.iterator]();
  const backgroundIter = background[Symbol.iterator]();

  while (true) {
    const fgResult = foregroundIter.next();
    const bgResult = backgroundIter.next();

    if (fgResult.done && bgResult.done) break;

    const fgSample = typeof fgResult.value === "number" ? fgResult.value : 0;
    const bgSample = typeof bgResult.value === "number" ? bgResult.value : 0;

    // Duck background when foreground is active
    const fgLevel = Math.abs(fgSample);
    const duckingGain = fgLevel > threshold ? duckRatio : 1.0;

    yield fgSample + bgSample * duckingGain;
  }
}
// SNIPEND ducking-mixing

// Create a voice-like signal with pauses
function* generateVoicePattern(sampleRate: number) {
  const patterns = [
    { freq: 200, duration: 1.0 }, // "Word 1"
    { freq: 0, duration: 0.3 }, // Pause
    { freq: 250, duration: 0.8 }, // "Word 2"
    { freq: 0, duration: 0.2 }, // Pause
    { freq: 180, duration: 1.2 }, // "Word 3"
    { freq: 0, duration: 0.5 }, // Final pause
  ];

  for (const pattern of patterns) {
    if (pattern.freq === 0) {
      // Silence
      const samples = Math.floor(pattern.duration * sampleRate);
      for (let i = 0; i < samples; i++) {
        yield 0;
      }
    } else {
      // Generate tone
      yield* generateSineWave(pattern.freq, pattern.duration, sampleRate, 0.4);
    }
  }
}

async function duckingDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Ducking Demo",
      quality: AudioQuality.Standard,
      channels: 1,
    });

    try {
      await stream.connect();
      console.log(`🎙️ Ducking demo @ ${stream.rate}Hz`);

      // Create foreground (voice) and background (music) signals
      const voice = generateVoicePattern(stream.rate);
      const backgroundMusic = generateSineWave(440, 4.0, stream.rate, 0.3);

      console.log("🎵 Playing voice with background music");
      console.log("📢 Background music will duck when voice is active");

      await stream.write(duckingMix(voice, backgroundMusic, 0.1, 0.2));
      console.log("✅ Ducking demo complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// Run the demo
duckingDemo().catch(console.error);
