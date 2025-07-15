import { startSession, AudioQuality } from "../lib/index.mjs";

await using session = await startSession();

const rate = 48_000;

// Choose your quality level based on your application needs
// Just specify the quality level you need - High, Standard, or Efficient
await using stream = await session.createAudioOutputStream({
  name: "Hello, PipeWire",
  quality: AudioQuality.High, // 🎯 Perfect for music - that's it!
  rate,
  channels: 2, // Use stereo so mono content plays in both ears
  role: "Music", // For proper audio routing and volume control
});

stream
  .on("stateChange", (state) => console.log("New state", state))
  .on("formatChange", (format) => {
    console.log(
      `🎵 Format: ${format.format.description} @ ${format.rate}Hz, ${format.channels} channels`
    );
  })
  .on("latencyChange", (latency) => console.log("Latency", latency))
  .on("propsChange", (props) => {
    console.log("Props changed:", props);
  })
  .on("unknownParamChange", (param) => {
    console.log("Unknown param changed:", param);
  })
  .on("error", (err) => console.error("Got error", err));

await stream.connect();

function* amplify(volume: number, samples: Iterable<number>) {
  for (const sample of samples) {
    yield sample * volume;
  }
}

function* concat(...samples: Array<Iterable<number>>) {
  for (const part of samples) {
    yield* part;
  }
}

function* clip(duration: number, rate: number, samples: Iterable<number>) {
  let i = 0;
  const maxIterations = duration * rate;
  for (const sample of samples) {
    if (i++ > maxIterations) {
      break;
    }

    yield sample;
  }
}

function* sineWave(frequency: number) {
  let accum = 0;
  const cycle = (Math.PI * 2) / rate;
  while (true) {
    accum += cycle * frequency;
    yield Math.sin(accum); // Range: -1.0 to +1.0 (full amplitude sine wave)
  }
}

function* mix(...samples: Array<Iterable<number>>) {
  const iterators = samples.map((s) => s[Symbol.iterator]());
  while (true) {
    let hasSample = false;
    let mixed = 0;
    for (const iterator of iterators) {
      const iteration = iterator.next();
      if (!iteration.done) {
        hasSample = true;
        mixed += iteration.value;
      }
    }
    if (!hasSample) {
      break;
    }

    yield mixed;
  }
}

const a4 = () => sineWave(440);
const c5 = () => sineWave(523.25);
const d5 = () => sineWave(587.33);
const e5 = () => sineWave(659.25);

const aMinor = (duration: number, rate: number) =>
  clip(duration, rate, mix(a4(), c5(), e5()));
const aMinorSus = (duration: number, rate: number) =>
  clip(duration, rate, mix(a4(), d5(), e5()));

// Always work with JavaScript Numbers in range -1.0 to +1.0
// 0.15 = 15% volume to prevent clipping when mixing multiple tones
const melody = amplify(
  0.15,
  concat(aMinor(2, rate), aMinorSus(2, rate), aMinor(4, rate))
);

// Convert mono melody to stereo by duplicating to both channels
function* monoToStereo(monoSamples: Iterable<number>) {
  for (const sample of monoSamples) {
    yield sample; // Left channel  (range: -1.0 to +1.0)
    yield sample; // Right channel (range: -1.0 to +1.0, same as left for center-panned mono)
  }
}

await stream.write(monoToStereo(melody));

await stream.isFinished();

// Check what format was actually negotiated
console.log(
  `\n📊 Stream used: ${stream.format.description} @ ${stream.rate}Hz, ${stream.channels} channels`
);
console.log(`✅ Format negotiation complete!`);
