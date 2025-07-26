import {
  startSession,
  AudioQuality,
  type PipeWireSession,
  type AudioOutputStream,
} from "pw-client";
import { setTimeout } from "node:timers/promises";

// SNIPSTART audio-manager-class
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
// SNIPEND audio-manager-class

// SNIPSTART audio-manager-explicit-resource-management
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
// SNIPEND audio-manager-explicit-resource-management

// SNIPSTART signal-handling-cleanup
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
// SNIPEND signal-handling-cleanup

// SNIPSTART signal-handling-with-explicit-resources
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
// SNIPEND signal-handling-with-explicit-resources

// Run a demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 Advanced Resource Management Demo");

  try {
    console.log("Testing explicit resource management with AudioManager...");
    await audioManagerWithExplicitResources();
    console.log(
      "✅ AudioManager explicit resource management demo completed!\n"
    );

    // Choose signal handling demo based on Node.js version
    const nodeVersion = parseInt(process.version.slice(1).split(".")[0]);

    if (nodeVersion >= 24) {
      console.log(
        "Testing signal handling with explicit resource management (Node.js 24+)..."
      );
      await longRunningAppWithExplicitResources();
      console.log("✅ Explicit resource signal handling demo completed!");
    } else {
      console.log(
        "Testing signal handling with manual cleanup (Node.js 22+)..."
      );
      await longRunningAppDemo();
      console.log("✅ Manual cleanup signal handling demo completed!");
    }
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}
