import { startSession } from "../lib/index.mjs";

await using session = await startSession();

const rate = 48_000;
await using stream = await session.createAudioOutputStream({
  rate,
  channels: 1,
  media: {
    type: "Audio",
    role: "Music",
    category: "Playback",
  },
});

await stream.connect();

await stream.write(
  (function* sampleStream() {
    for (let i = 0; i < 4 * rate; i++) {
      yield Math.random() * 0.5;
    }
  })()
);
