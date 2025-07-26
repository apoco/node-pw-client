import { startSession, AudioQuality } from "pw-client";
import { generateSineWave, generateNoise, delay } from "./audio-utils.mjs";
import { AudioMixer } from "./audio-mixer.mjs";

async function stereoMixerDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Stereo Mixer Demo",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    try {
      await stream.connect();
      console.log(`🎚️ Stereo mixer demo @ ${stream.rate}Hz`);

      const mixer = new AudioMixer();

      // Add tracks with different panning
      mixer.addTrack(generateSineWave(440, 4.0, stream.rate), {
        id: "left_tone",
        volume: 0.8,
        pan: -0.8, // Panned left
      });

      mixer.addTrack(generateSineWave(550, 4.0, stream.rate), {
        id: "right_tone",
        volume: 0.6,
        pan: 0.8, // Panned right
      });

      mixer.addTrack(generateNoise(4.0, stream.rate), {
        id: "center_noise",
        volume: 0.3,
        pan: 0.0, // Center
        effects: [delay(2205, 0.4, 0.3)], // Add delay effect
      });

      console.log("🎵 Playing stereo mix:");
      console.log("   📍 440Hz tone panned left");
      console.log("   📍 550Hz tone panned right");
      console.log("   📍 Noise in center with delay effect");

      await stream.write(mixer.mix(2));
      console.log("✅ Stereo mixing demo complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// Run the demo
stereoMixerDemo().catch(console.error);
