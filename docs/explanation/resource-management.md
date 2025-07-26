# Resource Management in Node.js

This document explains the different approaches to resource management in the PipeWire Node.js Client and when to use each pattern.

## Two Approaches to Resource Management

### Manual Cleanup (Node.js 22 LTS Compatible)

Use this approach for maximum compatibility with current Node.js versions:

<!-- resource-cleanup-basic.mts#manual-cleanup-basic -->

```typescript
async function basicExample() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Basic Example",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    try {
      await stream.connect();
      console.log("✅ Stream connected successfully");

      // Simulate some audio work
      await new Promise((resolve) => setTimeout(resolve, 100));
    } finally {
      await stream.dispose(); // Clean up the stream
    }
  } finally {
    await session.dispose(); // Clean up the session
  }
}
```

### Automatic Cleanup (Node.js 24+)

Use this approach when you can target newer Node.js or use a compiler like TypeScript or Babel that supports [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management):

<!-- resource-cleanup-basic.mts#automatic-cleanup -->

```typescript
async function automaticExample() {
  await using session = await startSession();
  await using stream = await session.createAudioOutputStream({
    name: "Automatic Example",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();
  console.log("✅ Stream connected, automatic cleanup enabled");

  // Simulate some audio work
  await new Promise((resolve) => setTimeout(resolve, 100));

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

Wrap your code in try/finally block to ensure that resources are cleaned up even in case of an error being thrown:

<!-- resource-cleanup-basic.mts#error-handling-cleanup -->

```typescript
async function errorHandlingExample() {
  const session = await startSession();
  try {
    const stream = await session.createAudioOutputStream({
      name: "Error Handling Example",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    try {
      await stream.connect();

      // Simulate an error during audio processing
      throw new Error("Simulated audio processing error");
    } finally {
      await stream.dispose(); // Always cleanup, even on errors
      console.log("✅ Stream cleaned up after error");
    }
  } catch (error) {
    console.log("⚠️  Error handled:", error);
  } finally {
    await session.dispose(); // Always cleanup, even on errors
    console.log("✅ Session cleaned up after error");
  }
}
```

### 2. Clean Up in Reverse Order

Clean up streams before sessions:

<!-- getting-started.mts#resource-cleanup -->

```typescript
    } finally {
      // Clean up the stream
      await stream.dispose();
    }
  } finally {
    // Clean up the session
    await session.dispose();
  }
```

### 3. Handle Errors During Cleanup

Cleanup can fail, so handle errors appropriately:

<!-- resource-cleanup-basic.mts#robust-cleanup-with-error-handling -->

```typescript
async function robustCleanupExample() {
  const session = await startSession();
  let stream: AudioOutputStream | null = null;

  try {
    stream = await session.createAudioOutputStream({
      name: "Robust Cleanup Example",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    await stream.connect();
    console.log("✅ Stream connected, doing some audio work...");

    // Simulate some audio work
    await new Promise((resolve) => setTimeout(resolve, 100));
  } finally {
    // Clean up stream - handle potential dispose() errors
    if (stream) {
      try {
        await stream.dispose();
        console.log("✅ Stream cleaned up successfully");
      } catch (cleanupError) {
        console.error("⚠️ Stream cleanup failed:", cleanupError);
        // Continue with session cleanup even if stream cleanup failed
      }
    }

    // Clean up session - handle potential dispose() errors
    try {
      await session.dispose();
      console.log("✅ Session cleaned up successfully");
    } catch (cleanupError) {
      console.error("⚠️ Session cleanup failed:", cleanupError);
      // Log the error but don't re-throw to avoid masking original errors
    }
  }
}
```

### 4. Long-Running Applications

For applications that run indefinitely, create helper functions:

<!-- resource-management.mts#audio-manager-class -->

```typescript
class AudioManager {
  private session: PipeWireSession | null;
  private readonly streams: Set<AudioOutputStream>;

  constructor() {
    this.session = null;
    this.streams = new Set();
  }

  async initialize() {
    this.session = await startSession();
  }

  async createStream(options: {
    name: string;
    quality?: AudioQuality;
    channels?: number;
  }) {
    if (!this.session) {
      throw new Error("AudioManager not initialized");
    }
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

  // Support for Explicit Resource Management (TC39 proposal)
  [Symbol.asyncDispose]() {
    return this.cleanup();
  }
}
```

#### Using AudioManager with Explicit Resource Management

When targeting Node.js 24+ or using a TypeScript compiler that supports [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management), you can use the `await using` syntax for automatic cleanup:

<!-- resource-management.mts#audio-manager-explicit-resource-management -->

```typescript
async function audioManagerWithExplicitResources() {
  console.log("⏱️  Testing explicit resource management (short demo)...");

  try {
    await using audioManager = new AudioManager();
    await audioManager.initialize();

    const stream = await audioManager.createStream({
      name: "Test Stream with Explicit Resources",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    await stream.connect();
    console.log("✅ Stream connected with explicit resource management");

    // Simulate some audio work (shorter for testing)
    await setTimeout(200);

    console.log(
      "✅ Work completed, resources will be cleaned up automatically"
    );
    // No manual cleanup needed - Symbol.asyncDispose handles it
  } catch (error) {
    console.error("Error in explicit resource management demo:", error);
    // Resources are still cleaned up automatically even if an error occurs
  }

  console.log("✅ Explicit resource management test completed");
}
```

### 5. Signal Handling for Long-Running Applications

For applications that run indefinitely, handle system signals to ensure graceful shutdown:

<!-- resource-management.mts#signal-handling-cleanup -->

```typescript
async function longRunningAppDemo() {
  const audioManager = new AudioManager();
  await audioManager.initialize();

  // Create and use streams
  const stream = await audioManager.createStream({
    name: "Long-Running Stream",
    quality: AudioQuality.Standard,
    channels: 2,
  });

  await stream.connect();
  console.log("✅ Long-running audio app started");
  console.log("   Press Ctrl+C to test graceful shutdown");

  // Keep running until interrupted
  await new Promise<void>((resolve) => {
    // Set up signal handlers for both SIGINT and SIGTERM
    const handleSignal = async () => {
      console.log("Shutting down gracefully...");
      await audioManager.cleanup();
      console.log("✅ Cleanup complete");
      resolve();
    };

    process.once("SIGINT", handleSignal);
    process.once("SIGTERM", handleSignal);
  });
}
```

#### Signal Handling with Explicit Resource Management

For modern environments that support explicit resource management, you can simplify signal handling:

<!-- resource-management.mts#signal-handling-with-explicit-resources -->

```typescript
async function longRunningAppWithExplicitResources() {
  try {
    await using audioManager = new AudioManager();
    await audioManager.initialize();

    const stream = await audioManager.createStream({
      name: "Long-Running Stream (Explicit Resources)",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    await stream.connect();
    console.log(
      "✅ Long-running audio app started (with explicit resource management)"
    );
    console.log("   Press Ctrl+C to test graceful shutdown");

    // Keep running until interrupted
    await new Promise<void>((resolve) => {
      const handleSignal = () => {
        console.log("Shutting down gracefully...");
        // No manual cleanup needed - the `await using` will handle it
        console.log("✅ Cleanup will be handled automatically");
        resolve();
      };

      process.once("SIGINT", handleSignal);
      process.once("SIGTERM", handleSignal);
    });
  } catch (error) {
    console.error("Error in long-running app:", error);
    // Resources are still cleaned up automatically even if an error occurs
  }
}
```

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

1. **Forgotten dispose calls**
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
