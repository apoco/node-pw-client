# Resource Management in Node.js

This document explains the different approaches to resource management in the PipeWire Node.js Client and when to use each pattern.

## Two Approaches to Resource Management

### Manual Cleanup (Node.js 22 LTS Compatible)

Use this approach for maximum compatibility with current Node.js versions:

```javascript
import { startSession, AudioQuality } from "pw-client";

async function example() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "My Audio App",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    try {
      await stream.connect();

      // Use the stream...
      // Your audio code here
    } finally {
      await stream.dispose(); // Clean up the stream
    }
  } finally {
    await session.dispose(); // Clean up the session
  }
}
```

### Automatic Cleanup (Node.js 24+)

Use this approach when you can target newer Node.js versions:

```javascript
import { startSession, AudioQuality } from "pw-client";

async function example() {
  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: "My Audio App",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();

  // Use the stream...
  // Your audio code here

  // Resources automatically cleaned up when scope exits
}
```

## Why Resource Management Matters

### PipeWire Resources

PipeWire sessions and streams use native system resources that need proper cleanup:

- **Session objects** maintain connections to the PipeWire daemon
- **Stream objects** hold audio buffers and graph connections
- **Native memory** is allocated for audio processing

### What Happens Without Cleanup

If you don't clean up resources:

- 🚫 **Memory leaks** - Native resources remain allocated
- 🚫 **Connection limits** - PipeWire may refuse new connections
- 🚫 **System instability** - Audio system may become unresponsive
- 🚫 **Resource exhaustion** - System resources get depleted

### What Proper Cleanup Does

When you call `dispose()` or use `await using`:

- ✅ **Releases native memory** - C++ objects are properly destroyed
- ✅ **Closes PipeWire connections** - Network resources are freed
- ✅ **Flushes audio buffers** - Any pending audio is processed
- ✅ **Updates audio graph** - PipeWire removes the stream from its graph

## Node.js Version Compatibility

### Node.js 22 LTS (Current)

- ✅ Manual cleanup with `dispose()` methods
- ❌ No explicit resource management (`await using`)
- 🎯 **Recommended for production** - Most stable and widely supported

### Node.js 24+ (Future)

- ✅ Manual cleanup with `dispose()` methods
- ✅ Automatic cleanup with `await using`
- 🚀 **Future-ready** - Cleaner syntax when available

## Best Practices

### 1. Always Use try/finally Blocks

Even with manual cleanup, wrap your code in try/finally:

```javascript
const session = await startSession();
try {
  // Your code here
} finally {
  await session.dispose(); // Always cleanup, even on errors
}
```

### 2. Clean Up in Reverse Order

Clean up streams before sessions:

```javascript
const session = await startSession();
try {
  const stream = await session.createAudioOutputStream(options);
  try {
    // Use stream
  } finally {
    await stream.dispose(); // Stream first
  }
} finally {
  await session.dispose(); // Session last
}
```

### 3. Handle Errors During Cleanup

Cleanup can fail, so handle errors appropriately:

```javascript
try {
  // Your audio code
} finally {
  try {
    await stream.dispose();
  } catch (cleanupError) {
    console.error("Failed to cleanup stream:", cleanupError);
  }

  try {
    await session.dispose();
  } catch (cleanupError) {
    console.error("Failed to cleanup session:", cleanupError);
  }
}
```

### 4. Long-Running Applications

For applications that run indefinitely, create helper functions:

```javascript
class AudioManager {
  constructor() {
    this.session = null;
    this.streams = new Set();
  }

  async initialize() {
    this.session = await startSession();
  }

  async createStream(options) {
    const stream = await this.session.createAudioOutputStream(options);
    this.streams.add(stream);
    return stream;
  }

  async cleanup() {
    // Clean up all streams
    for (const stream of this.streams) {
      try {
        await stream.dispose();
      } catch (error) {
        console.error("Stream cleanup failed:", error);
      }
    }
    this.streams.clear();

    // Clean up session
    if (this.session) {
      try {
        await this.session.dispose();
      } catch (error) {
        console.error("Session cleanup failed:", error);
      }
      this.session = null;
    }
  }
}

// Usage
const audioManager = new AudioManager();

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await audioManager.cleanup();
  process.exit(0);
});
```

## Migration Guide

### From Automatic to Manual (Node.js 24+ → 22)

Replace `await using` with try/finally:

```javascript
// Before (Node.js 24+)
await using session = await startSession();
await using stream = await session.createAudioOutputStream(options);
// Use stream...

// After (Node.js 22)
const session = await startSession();
try {
  const stream = await session.createAudioOutputStream(options);
  try {
    // Use stream...
  } finally {
    await stream.dispose();
  }
} finally {
  await session.dispose();
}
```

### From Manual to Automatic (Node.js 22 → 24+)

Replace try/finally with `await using`:

```javascript
// Before (Node.js 22)
const session = await startSession();
try {
  const stream = await session.createAudioOutputStream(options);
  try {
    // Use stream...
  } finally {
    await stream.dispose();
  }
} finally {
  await session.dispose();
}

// After (Node.js 24+)
await using session = await startSession();
await using stream = await session.createAudioOutputStream(options);
// Use stream...
```

## Performance Considerations

### Cleanup Overhead

- **Manual cleanup** - Explicit async calls, slightly more verbose
- **Automatic cleanup** - Zero overhead, handled by JavaScript engine
- **Both approaches** have identical runtime performance for audio processing

### Memory Usage

- **Proper cleanup** - Constant memory usage regardless of session count
- **No cleanup** - Memory usage grows linearly with uncleaned resources

### Latency Impact

Resource cleanup happens asynchronously and doesn't affect audio latency or real-time performance.

## Debugging Resource Leaks

### Symptoms

- Application memory usage grows over time
- "Too many open files" errors
- PipeWire connection failures
- Audio dropouts or glitches

### Tools

Use Node.js debugging tools to track resource usage:

```bash
# Monitor memory usage
node --inspect your-app.mjs

# Enable garbage collection logging
node --trace-gc your-app.mjs

# Profile memory usage
node --prof your-app.mjs
```

### Common Causes

1. **Forgotten dispose calls** - Missing `finally` blocks
2. **Exception during cleanup** - Errors preventing cleanup
3. **Circular references** - Objects holding references to each other
4. **Event listeners** - Unremoved listeners preventing garbage collection

## Summary

- 🎯 **Use manual cleanup** for Node.js 22 LTS compatibility
- 🚀 **Use automatic cleanup** when targeting Node.js 24+
- 🛡️ **Always clean up resources** to prevent leaks and system issues
- 📋 **Follow the patterns** shown in our tutorials for reliable code
- 🔍 **Test thoroughly** especially resource cleanup under error conditions

Choose the pattern that matches your target Node.js version and stick with it consistently throughout your application.
