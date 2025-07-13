import { AudioFormat, startSession } from "../lib/index.mjs";

await using session = await startSession();

const rate = 48_000;
await using stream = await session.createAudioOutputStream({
  name: "Hello, PipeWire",
  format: AudioFormat.Uint16,
  rate,
  channels: 1,
  media: {
    type: "Audio",
    role: "Music",
    category: "Playback",
  },
});

stream
  .on("stateChange", (state) => console.log("New state", state))
  .on("formatChange", (format) => {
    console.log("Format changed:", format);
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

function* clip(duration, rate, samples: Iterable<number>) {
  let i = 0;
  const maxIterations = duration * rate;
  for (const sample of samples) {
    if (i++ > maxIterations) {
      break;
    }

    yield sample;
  }
}

function* sineWave(frequency) {
  let accum = 0;
  const cycle = (Math.PI * 2) / rate;
  while (true) {
    accum += cycle * frequency;
    yield Math.sin(accum);
  }
}

function floatToU8(sample) {
  return Math.floor(127.5 * (sample + 1));
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

const aMinor = (duration, rate) => clip(duration, rate, mix(a4(), c5(), e5()));
const aMinorSus = (duration, rate) =>
  clip(duration, rate, mix(a4(), d5(), e5()));

const melody = amplify(
  0.15,
  concat(aMinor(2, rate), aMinorSus(2, rate), aMinor(4, rate))
);

await stream.write(melody);

await stream.isFinished();
