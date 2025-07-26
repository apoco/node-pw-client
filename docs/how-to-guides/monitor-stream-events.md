# Monitor Stream State and Events

Audio streams emit events as they connect, negotiate formats, and handle errors. This guide shows you how to monitor and respond to these events for robust audio applications.

> **📁 Complete Example**: [`examples/stream-events.mts`](../../examples/stream-events.mts)
>
> ```bash
> npx tsx examples/stream-events.mts
> ```

## Basic Event Monitoring

Every audio stream emits events that let you monitor its lifecycle:

<!-- stream-events.mts#basic-event-handling -->

```typescript
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
```

## Available Events

### `stateChange`

Fired when the stream's connection state changes:

- `"connecting"` - Stream is establishing connection
- `"streaming"` - Stream is active and ready for audio
- `"error"` - Stream encountered an error
- `"unconnected"` - Stream is disconnected

### `formatChange`

Fired when audio format negotiation completes. This tells you the exact sample rate, channels, and format that will be used:

<!-- stream-events.mts#advanced-event-handling -->

```typescript
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
```

### `error`

Fired when stream errors occur. Always handle this event to prevent crashes.

### `latencyChange` (Optional)

Fired when the stream's latency changes, useful for latency-sensitive applications.

### `propsChange` (Optional)

Fired when stream properties are updated by the audio system.

## Event-Driven Audio Generation

While `connect()` already blocks until format negotiation is complete, you might want to use events for more complex scenarios like long-running applications or dynamic audio generation:

<!-- stream-events.mts#event-based-audio-generation -->

```typescript
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
```

**📝 Note:** For simple cases, you don't need events - `connect()` already waits for format negotiation:

```typescript
await stream.connect(); // Blocks until format negotiation complete
await stream.write(generateTone(440, 2.0, stream.rate)); // Safe to use stream.rate, stream.channels
```

## Error Handling with Events

Robust applications handle stream errors gracefully:

<!-- stream-events.mts#error-handling-events -->

```typescript
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
```

## Best Practices

### ✅ Do

- **Always handle `error` events** to prevent uncaught exceptions
- **Use `formatChange` to access negotiated properties** during connection (optional)
- **Remember that `connect()` blocks** until format negotiation is complete
- **Use `await using`** for automatic cleanup on errors

### ❌ Don't

- **Don't assume you need events for basic audio generation** - `connect()` already waits for format negotiation
- **Don't ignore error events** - this can crash your application
- **Don't assume specific formats** - always use negotiated values from `stream.rate`, `stream.channels`

## Troubleshooting

### Events Not Firing

- Ensure you attach event listeners **before** calling `stream.connect()`
- Check that you're not blocking the event loop with synchronous operations

### Missed `formatChange` Events

- The event fires only once during connection
- If you need format info later, use `stream.rate`, `stream.channels`, `stream.format`

### Error Event Crashes

- Always attach an `error` event handler
- Use `await using` for automatic cleanup on errors

---

**💡 Stream events provide real-time feedback about your audio connection, enabling responsive and robust audio applications.**
