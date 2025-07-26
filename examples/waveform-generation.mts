import { startSession, AudioQuality } from "pw-client";
import {
  generateSineWave,
  generateNoise,
  generateSquareWave,
  generateSawtoothWave,
  generateTriangleWave,
} from "./audio-utils.mjs";

await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Waveform Generator",
  quality: AudioQuality.Standard,
  channels: 1, // Mono for simple waveforms
});

await stream.connect();
console.log(`🎵 Ready to generate waveforms @ ${stream.rate}Hz`);

// Usage
console.log("🎵 Playing sine wave...");
await stream.write(generateSineWave(440, 1.0, stream.rate));

// Usage
console.log("🎵 Playing square wave...");
await stream.write(generateSquareWave(440, 1.0, stream.rate));

// Usage
console.log("🎵 Playing sawtooth wave...");
await stream.write(generateSawtoothWave(440, 1.0, stream.rate));

// Usage
console.log("🎵 Playing triangle wave...");
await stream.write(generateTriangleWave(440, 1.0, stream.rate));

// Usage
console.log("🎵 Playing white noise...");
await stream.write(generateNoise(1.0, stream.rate));

function* pinkNoise(duration: number, volume = 0.1) {
  const samples = Math.floor(duration * stream.rate);

  // Simple pink noise approximation using multiple octaves
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;

  for (let i = 0; i < samples; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;

    yield pink * volume * 0.11; // Scale down
  }
}

// Usage
console.log("🎵 Playing pink noise...");
await stream.write(pinkNoise(1.0));

console.log("✨ Waveform demo complete!");

function* bandLimitedSawtooth(
  frequency: number,
  duration: number,
  volume = 0.3,
) {
  const samples = Math.floor(duration * stream.rate);
  const cycle = (Math.PI * 2) / stream.rate;
  let phase = 0;

  // Calculate maximum harmonic to avoid aliasing
  const maxHarmonic = Math.floor(stream.rate / (2 * frequency));

  for (let i = 0; i < samples; i++) {
    let sample = 0;

    // Sum harmonics up to Nyquist frequency
    for (let harmonic = 1; harmonic <= maxHarmonic; harmonic++) {
      sample += Math.sin(phase * frequency * harmonic) / harmonic;
    }

    yield (sample * volume * 2) / Math.PI; // Scale to proper amplitude
    phase += cycle;
  }
}

// Demo the band-limited sawtooth
console.log("🎵 Playing band-limited sawtooth (reduces aliasing)...");
await stream.write(bandLimitedSawtooth(440, 1.0));
