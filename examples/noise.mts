import { startSession, AudioQuality } from "pw-client";

function* generateStereoNoise(
  durationSeconds: number,
  sampleRate: number,
  volume = 0.5,
) {
  const totalSamples = durationSeconds * sampleRate * 2; // 2 channels

  for (let i = 0; i < totalSamples; i += 2) {
    // Generate independent random noise for each channel
    for (let ch = 0; ch < 2; ch++) {
      const sample = (Math.random() - 0.5) * volume;
      yield sample;
    }
  }
}

await using session = await startSession();

await using stream = await session.createAudioOutputStream({
  name: "Stereo Noise Demo",
  quality: AudioQuality.Standard,
  channels: 2, // Stereo for proper playback in both ears
  autoConnect: true,
});

await stream.write(
  generateStereoNoise(4.0, stream.rate, 0.5), // 4 seconds of stereo noise at 50% volume
);

console.log("🎵 Stereo noise demo complete!");
