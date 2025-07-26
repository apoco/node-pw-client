import { startSession, AudioQuality } from "pw-client";

// SNIPSTART basic-event-handling
await using session = await startSession();
await using stream = await session.createAudioOutputStream({
  name: "Event Monitor",
  quality: AudioQuality.Standard,
});

// Listen to all stream events
stream
  .on("stateChange", (state) => {
    console.log(`🔄 Stream state: ${state}`);
  })
  .on("formatChange", (format) => {
    console.log(
      `🎵 Format negotiated: ${format.format.description} @ ${format.rate}Hz, ${format.channels} channels`
    );
  })
  .on("error", (err) => {
    console.error("❌ Stream error:", err);
  });

await stream.connect();
// SNIPEND basic-event-handling

// SNIPSTART advanced-event-handling
// More detailed event monitoring
stream
  .on("stateChange", (state) => {
    switch (state) {
      case "connecting":
        console.log("🔄 Connecting to audio system...");
        break;
      case "streaming":
        console.log("✅ Stream active and ready!");
        break;
      case "error":
        console.log("❌ Stream encountered an error");
        break;
      case "unconnected":
        console.log("🔌 Stream disconnected");
        break;
    }
  })
  .on("formatChange", (format) => {
    // Format negotiation complete - now we know the exact audio format
    console.log(`📊 Negotiated format details:`);
    console.log(`   • Format: ${format.format.description}`);
    console.log(`   • Sample rate: ${format.rate}Hz`);
    console.log(`   • Channels: ${format.channels}`);

    // You can now use stream.rate, stream.channels, stream.format
    console.log(`📈 Stream properties: ${stream.rate}Hz, ${stream.channels}ch`);
  })
  .on("latencyChange", (latency) => {
    console.log(`⏱️ Latency changed:`);
    console.log(`   • Direction: ${latency.direction}`);
    console.log(
      `   • Min: ${Number(latency.min.nanoseconds) / 1_000_000}ms (${latency.min.quantum}/${latency.min.rate})`
    );
    console.log(
      `   • Max: ${Number(latency.max.nanoseconds) / 1_000_000}ms (${latency.max.quantum}/${latency.max.rate})`
    );
  })
  .on("propsChange", (props) => {
    console.log("🔧 Stream properties updated:", props);
  });
// SNIPEND advanced-event-handling

// SNIPSTART event-based-audio-generation
// Use events to trigger audio generation
let isGenerating = false;
let audioCompleteResolve: (() => void) | null = null;
const audioCompletePromise = new Promise<void>((resolve) => {
  audioCompleteResolve = resolve;
});

stream.on("stateChange", (state) => {
  if (state === "streaming" && !isGenerating) {
    isGenerating = true;
    console.log("🎵 Stream ready - starting audio generation...");

    // Generate audio only after format is negotiated - handle async without blocking
    const generateAndWrite = async () => {
      function* generateTone(frequency: number, duration: number) {
        const totalSamples = Math.floor(
          duration * stream.rate * stream.channels
        );
        const cycle = (Math.PI * 2) / stream.rate;
        let phase = 0;

        for (let i = 0; i < totalSamples; i += stream.channels) {
          const sample = Math.sin(phase * frequency) * 0.3;

          // Output to all channels
          for (let ch = 0; ch < stream.channels; ch++) {
            yield sample;
          }
          phase += cycle;
        }
      }

      await stream.write(generateTone(440, 2.0));
      console.log("🎵 Audio generation complete");
      audioCompleteResolve?.();
    };

    // Execute async generation
    generateAndWrite().catch((error) => {
      console.error("Audio generation error:", error);
      audioCompleteResolve?.();
    });
  }
});

await stream.connect();

// Wait for audio generation to complete before disposing
await audioCompletePromise;
// SNIPEND event-based-audio-generation

// SNIPSTART error-handling-events
// Robust error handling with events
stream.on("error", (error) => {
  console.error("❌ Stream error occurred:", error.message);

  // Attempt recovery or cleanup
  try {
    console.log(
      "🔄 Stream error occurred, cleanup will be handled automatically"
    );
    // Stream will be automatically disposed due to 'await using'
  } catch (cleanupError) {
    console.error("💥 Error during cleanup:", cleanupError);
  }
});

// Monitor for unexpected disconnections
stream.on("stateChange", (state) => {
  if (state === "unconnected") {
    console.log("🔌 Stream unexpectedly disconnected");
    // Handle reconnection logic here if needed
  }
});
// SNIPEND error-handling-events
