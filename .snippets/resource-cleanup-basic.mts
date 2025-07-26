#!/usr/bin/env npx tsx

/**
 * Basic resource cleanup patterns demonstration
 */

import { startSession, AudioQuality, type AudioOutputStream } from "pw-client";

// SNIPSTART manual-cleanup-basic
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
// SNIPEND manual-cleanup-basic

// SNIPSTART automatic-cleanup
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
// SNIPEND automatic-cleanup

// SNIPSTART error-handling-cleanup
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
// SNIPEND error-handling-cleanup

// SNIPSTART robust-cleanup-with-error-handling
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
// SNIPEND robust-cleanup-with-error-handling

// Run demos if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 Basic Resource Cleanup Patterns");

  try {
    console.log("Testing basic manual cleanup...");
    await basicExample();
    console.log("✅ Basic example completed successfully\n");

    console.log("Testing automatic cleanup (Node.js 24+)...");
    await automaticExample();
    console.log("✅ Automatic example completed successfully\n");

    console.log("Testing error handling...");
    await errorHandlingExample();
    console.log("✅ Error handling example completed successfully\n");

    console.log("Testing robust cleanup with error handling...");
    await robustCleanupExample();
    console.log("✅ Robust cleanup example completed successfully");
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  }
}
