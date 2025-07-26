# Monitor Performance

Track audio processing performance and identify bottlenecks in your applications.

## Problem

You need to measure and monitor the performance characteristics of your audio processing, especially when comparing different quality levels or optimizing for real-time performance.

## Solution

### Basic Performance Monitoring

Measure processing time and real-time performance ratio:

<!-- monitor-performance.mts#basic-monitoring -->

```typescript
console.log("📊 Basic Performance Monitoring Example:");

async function basicPerformanceTest(quality: AudioQuality) {
  const startTime = performance.now();
  const testDuration = 1.0; // seconds

  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: `Performance Test ${quality}`,
    quality,
    channels: 2,
  });

  await stream.connect();

  // Generate test audio
  function* testSignal() {
    const samples = testDuration * stream.rate * stream.channels;
    for (let i = 0; i < samples; i++) {
      yield Math.sin(i * 0.01) * 0.1;
    }
  }

  await stream.write(testSignal());

  const endTime = performance.now();
  const processingTime = endTime - startTime;
  const realTimeRatio = processingTime / (testDuration * 1000);

  return {
    quality,
    format: stream.format.description,
    rate: stream.rate,
    processingTimeMs: processingTime,
    realTimeRatio,
    efficiency: 1 / realTimeRatio, // Higher is better
  };
}

// Test a single quality level
const result = await basicPerformanceTest(AudioQuality.Standard);
console.log(`Performance results:`, result);
```

### Compare Quality Level Performance

Benchmark all quality levels to understand their relative performance:

<!-- monitor-performance.mts#quality-comparison -->

```typescript
console.log("🔄 Quality Level Performance Comparison:");

async function compareQualityPerformance() {
  const results: Array<{
    quality: AudioQuality;
    format: string;
    rate: number;
    processingTimeMs: number;
    realTimeRatio: number;
    efficiency: number;
  }> = [];

  for (const quality of [
    AudioQuality.High,
    AudioQuality.Standard,
    AudioQuality.Efficient,
  ]) {
    console.log(`Testing ${quality} quality...`);
    const result = await basicPerformanceTest(quality);
    results.push(result);

    // Brief pause between tests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Display comparison
  console.log("\n📊 Quality Level Performance Comparison:");
  console.log(
    "Quality     | Format      | Rate   | Processing | Real-time Ratio | Efficiency"
  );
  console.log(
    "------------|-------------|--------|------------|-----------------|----------"
  );

  for (const result of results) {
    const quality = result.quality.padEnd(11);
    const format = result.format.split(" ")[0].padEnd(11); // Just format name
    const rate = `${result.rate}Hz`.padEnd(6);
    const processing = `${result.processingTimeMs.toFixed(1)}ms`.padEnd(10);
    const ratio = result.realTimeRatio.toFixed(3).padEnd(15);
    const efficiency = `${result.efficiency.toFixed(1)}x`.padEnd(10);

    console.log(
      `${quality} | ${format} | ${rate} | ${processing} | ${ratio} | ${efficiency}`
    );
  }

  // Find the most efficient
  const mostEfficient = results.reduce((best, current) =>
    current.efficiency > best.efficiency ? current : best
  );

  console.log(
    `\n🏆 Most efficient: ${mostEfficient.quality} (${mostEfficient.efficiency.toFixed(1)}x real-time)`
  );

  return results;
}

await compareQualityPerformance();
```

### Real-Time Performance Monitoring

Monitor performance during live audio processing:

<!-- monitor-performance.mts#realtime-monitoring -->

```typescript
console.log("⏱️ Real-Time Performance Monitoring Example:");

class PerformanceMonitor {
  private readonly samples: Array<number> = [];
  private readonly maxSamples = 100; // Keep last 100 measurements

  recordProcessingTime(timeMs: number) {
    this.samples.push(timeMs);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  getStats() {
    if (this.samples.length === 0) return null;

    const sorted = [...this.samples].sort((a, b) => a - b);
    const sum = this.samples.reduce((a, b) => a + b, 0);

    return {
      count: this.samples.length,
      average: sum / this.samples.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  printStats() {
    const stats = this.getStats();
    if (!stats) {
      console.log("No performance data collected yet");
      return;
    }

    console.log("🔍 Performance Statistics (last 100 operations):");
    console.log(`  Average: ${stats.average.toFixed(2)}ms`);
    console.log(`  Median:  ${stats.median.toFixed(2)}ms`);
    console.log(`  Min:     ${stats.min.toFixed(2)}ms`);
    console.log(`  Max:     ${stats.max.toFixed(2)}ms`);
    console.log(`  95th %:  ${stats.p95.toFixed(2)}ms`);
    console.log(`  99th %:  ${stats.p99.toFixed(2)}ms`);
  }
}

async function realtimeMonitoringExample() {
  const monitor = new PerformanceMonitor();

  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: "Real-time Monitor",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();

  // Simulate multiple processing operations
  for (let i = 0; i < 50; i++) {
    const start = performance.now();

    // Simulate processing a small audio chunk
    function* chunk() {
      const samples = 1024; // Small buffer
      for (let j = 0; j < samples; j++) {
        yield Math.sin((i * 1024 + j) * 0.01) * 0.1;
      }
    }

    await stream.write(chunk());

    const processingTime = performance.now() - start;
    monitor.recordProcessingTime(processingTime);

    // Print stats every 10 operations
    if ((i + 1) % 10 === 0) {
      console.log(`\nAfter ${i + 1} operations:`);
      monitor.printStats();
    }

    // Brief pause to simulate real-time constraints
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

await realtimeMonitoringExample();
```

### Memory Usage Monitoring

Track memory usage patterns during audio processing:

<!-- monitor-performance.mts#memory-monitoring -->

```typescript
console.log("💾 Memory Usage Monitoring Example:");

function formatBytes(bytes: number): string {
  if (!bytes) return "0 Bytes";

  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const formatted =
    parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];

  return isNegative ? `-${formatted}` : formatted;
}

async function memoryUsageTest(quality: AudioQuality) {
  // Force garbage collection if available (Node.js with --expose-gc)
  if (global.gc) {
    global.gc();
  }

  const initialMemory = process.memoryUsage();
  console.log(`📊 Memory usage test for ${quality} quality:`);
  console.log(`Initial heap: ${formatBytes(initialMemory.heapUsed)}`);

  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: `Memory Test ${quality}`,
    quality,
    channels: 2,
  });

  await stream.connect();

  const afterConnectionMemory = process.memoryUsage();
  console.log(
    `After connection: ${formatBytes(afterConnectionMemory.heapUsed)}`
  );

  // Process larger amount of audio
  function* largeSignal() {
    const samples = 2 * stream.rate * stream.channels; // 2 seconds
    for (let i = 0; i < samples; i++) {
      yield Math.sin(i * 0.001) * 0.1;
    }
  }

  await stream.write(largeSignal());

  const afterProcessingMemory = process.memoryUsage();
  console.log(
    `After processing: ${formatBytes(afterProcessingMemory.heapUsed)}`
  );

  const totalIncrease = afterProcessingMemory.heapUsed - initialMemory.heapUsed;
  if (totalIncrease > 0) {
    console.log(`Total memory increase: ${formatBytes(totalIncrease)}`);
  } else if (totalIncrease < 0) {
    console.log(
      `Total memory decrease: ${formatBytes(-totalIncrease)} (likely due to garbage collection)`
    );
  } else {
    console.log(`Total memory change: ${formatBytes(totalIncrease)}`);
  }

  return {
    quality,
    format: stream.format.description,
    initialHeap: initialMemory.heapUsed,
    afterConnection: afterConnectionMemory.heapUsed,
    afterProcessing: afterProcessingMemory.heapUsed,
    totalIncrease,
  };
}

// Test memory usage for different quality levels
for (const quality of [
  AudioQuality.Efficient,
  AudioQuality.Standard,
  AudioQuality.High,
]) {
  await memoryUsageTest(quality);
  console.log(); // Blank line between tests
}
```

## Why This Works

- **Performance.now()**: Provides high-resolution timing for accurate measurements
- **Real-time ratio**: Compares processing time to actual audio duration
- **Statistical analysis**: Percentiles help identify performance outliers
- **Memory tracking**: Identifies memory leaks or excessive allocation

## Tips

- Run performance tests multiple times for reliable results
- Test on your target hardware configuration
- Monitor both CPU and memory usage
- Consider system load when interpreting results

## Related Guides

- [Choose the Right Audio Quality](choose-audio-quality.md) - Quality vs. performance trade-offs
- [Test Negotiated Audio Formats](test-negotiated-formats.md) - Verify format expectations
