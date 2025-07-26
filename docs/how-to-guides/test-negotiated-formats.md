# Test Negotiated Audio Formats

Verify that your audio streams negotiate the expected formats and quality levels.

## Problem

You want to ensure that your audio streams are using the formats you expect, especially when using quality levels that have format priorities.

## Solution

### Check Negotiated Format After Connection

The most reliable way to verify negotiated formats is to check the stream properties after connecting:

<!-- test-negotiated-formats.mts#basic-format-check -->

```typescript
console.log("🔍 Basic Format Check Example:");

await using session1 = await startSession();
await using stream1 = await session1.createAudioOutputStream({
  name: "Format Test",
  quality: AudioQuality.High,
  channels: 2,
});

// Connect first, then check negotiated format
await stream1.connect();

console.log(`Negotiated format: ${stream1.format.description}`);
console.log(`Sample rate: ${stream1.rate} Hz`);
console.log(`Channels: ${stream1.channels}`);
console.log(`Bytes per sample: ${stream1.format.byteSize}`);
```

### Validate Quality Level Expectations

Create assertions to ensure the negotiated format meets your quality level expectations:

<!-- test-negotiated-formats.mts#quality-validation -->

```typescript
console.log("✅ Quality Validation Example:");

async function validateQuality(
  stream: AudioOutputStream,
  expectedQuality: AudioQuality
) {
  await stream.connect();

  const format = stream.format;
  const rate = stream.rate;

  switch (expectedQuality) {
    case AudioQuality.High:
      console.assert(
        format.description.includes("float") || format.byteSize >= 3,
        "High quality should prefer floating-point or high precision formats"
      );
      console.assert(
        rate >= 44100,
        "High quality should have adequate sample rate"
      );
      break;

    case AudioQuality.Standard:
      console.assert(
        format.byteSize >= 2,
        "Standard quality should have at least 16-bit precision"
      );
      console.assert(
        rate >= 44100,
        "Standard quality should have CD-quality sample rate"
      );
      break;

    case AudioQuality.Efficient:
      // Efficient accepts any format that works
      console.assert(
        format.byteSize >= 1,
        "Efficient quality should have reasonable precision"
      );
      break;
  }

  console.log(`✅ ${expectedQuality} quality validation passed`);
  console.log(`   Format: ${format.description}`);
  console.log(`   Rate: ${rate}Hz`);
}

// Test all quality levels
await using session2 = await startSession();

for (const quality of [
  AudioQuality.High,
  AudioQuality.Standard,
  AudioQuality.Efficient,
]) {
  await using stream = await session2.createAudioOutputStream({
    name: `Test ${quality}`,
    quality,
    channels: 2,
  });

  await validateQuality(stream, quality);
}
```

### Test Format Fallback Behavior

Verify that quality levels gracefully fall back to available formats:

<!-- test-negotiated-formats.mts#fallback-testing -->

```typescript
console.log("🔄 Fallback Testing Example:");

async function testFormatFallback() {
  await using session = await startSession();

  // Test that High quality falls back gracefully on different systems
  await using stream = await session.createAudioOutputStream({
    name: "Fallback Test",
    quality: AudioQuality.High,
    channels: 2,
  });

  await stream.connect();

  console.log("Format fallback test:");
  console.log(`  Requested: High quality`);
  console.log(`  Negotiated: ${stream.format.description} at ${stream.rate}Hz`);

  // High quality should never fall back to formats worse than 16-bit (2 bytes)
  console.assert(
    stream.format.byteSize >= 2,
    "High quality should never negotiate below 16-bit precision"
  );

  console.log("✅ Fallback behavior is acceptable");
}

await testFormatFallback();
```

## Why This Works

- **Post-connection checking**: Format negotiation only happens during connection
- **Quality level validation**: Ensures your quality choices have the expected results
- **Fallback testing**: Verifies graceful degradation on different systems

## Related Guides

- [Choose the Right Audio Quality](choose-audio-quality.md) - Selecting appropriate quality levels
- [Monitor Performance](monitor-performance.md) - Track performance metrics for different formats
