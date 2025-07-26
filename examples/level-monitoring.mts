import { startSession, AudioQuality } from "pw-client";

function* levelMonitor(
  generator: Iterable<number>,
  callback: (levels: { peak: number; rms: number }) => void,
) {
  let peak = 0;
  let rms = 0;
  let sampleCount = 0;

  for (const sample of generator) {
    peak = Math.max(peak, Math.abs(sample));
    rms += sample * sample;
    sampleCount++;

    if (sampleCount % 1024 === 0) {
      callback({
        peak,
        rms: Math.sqrt(rms / sampleCount),
      });
      peak = 0;
      rms = 0;
      sampleCount = 0;
    }

    yield sample;
  }
}

function softLimit(sample: number, threshold = 0.8) {
  const abs = Math.abs(sample);
  if (abs > threshold) {
    const sign = sample < 0 ? -1 : 1;
    return sign * (threshold + (abs - threshold) / (1 + (abs - threshold)));
  }
  return sample;
}

// Create a signal that gets progressively louder
function* generateLoudSignal(sampleRate: number, duration: number) {
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Create a signal that gets progressively louder
    const amplitude = 0.3 + (t / duration) * 1.2; // Goes from 0.3 to 1.5
    const frequency = 440 + Math.sin(t * 3) * 50; // Wobbling frequency
    yield Math.sin((i * Math.PI * 2 * frequency) / sampleRate) * amplitude;
  }
}

async function levelMonitoringDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Level Monitoring Demo",
      quality: AudioQuality.Standard,
      channels: 1,
    });

    try {
      await stream.connect();
      console.log(`📊 Level monitoring demo @ ${stream.rate}Hz`);

      // Create a loud signal that will trigger the limiter
      const loudSignal = generateLoudSignal(stream.rate, 4.0);

      // Monitor levels and apply soft limiting
      console.log("🎵 Playing signal with real-time level monitoring:");
      console.log(
        "📈 Peak and RMS levels will be displayed every 1024 samples",
      );
      console.log("🛡️ Soft limiter engaged at 80% to prevent clipping");

      const monitoredSignal = levelMonitor(loudSignal, (levels) => {
        const peakDb = 20 * Math.log10(levels.peak);
        const rmsDb = 20 * Math.log10(levels.rms);
        console.log(
          `📊 Peak: ${levels.peak.toFixed(3)} (${peakDb.toFixed(1)}dB), RMS: ${levels.rms.toFixed(3)} (${rmsDb.toFixed(1)}dB)`,
        );
      });

      // Apply soft limiting to prevent clipping
      function* limitedSignal() {
        for (const sample of monitoredSignal) {
          yield softLimit(sample, 0.8); // Limit at 80% to prevent clipping
        }
      }

      await stream.write(limitedSignal());
      console.log("✅ Level monitoring demo complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// Run the demo
levelMonitoringDemo().catch(console.error);
