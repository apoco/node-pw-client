import { startSession, AudioQuality } from "../lib/index.mjs";

console.log("🔧 Minimal Rate Negotiation Test");

await using session = await startSession();

console.log("Creating stream with High quality...");
await using stream = await session.createAudioOutputStream({
  name: "Minimal Test",
  quality: AudioQuality.High,
  channels: 2,
});

console.log("Setting up format change listener...");
stream.on("formatChange", (format) => {
  console.log(`Negotiated: ${format.format.description} @ ${format.rate}Hz`);
});

console.log("Connecting stream...");
await stream.connect();

console.log("Connection successful!");
console.log(`Final result: ${stream.format.description} @ ${stream.rate}Hz`);

console.log("✅ Rate negotiation test complete - no audio playback");
