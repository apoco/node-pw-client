import { startSession, AudioQuality } from "pw-client";

class CircularBuffer {
  private buffer: Float32Array;
  private writeIndex: number;
  private readIndex: number;
  private readonly size: number;

  constructor(size: number) {
    this.buffer = new Float32Array(size);
    this.writeIndex = 0;
    this.readIndex = 0;
    this.size = size;
  }

  write(sample: number) {
    this.buffer[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.size;
  }

  read() {
    const sample = this.buffer[this.readIndex];
    this.readIndex = (this.readIndex + 1) % this.size;
    return sample;
  }

  get length() {
    return this.writeIndex >= this.readIndex
      ? this.writeIndex - this.readIndex
      : this.size - (this.readIndex - this.writeIndex);
  }

  get bufferSize() {
    return this.size;
  }
}

function* delayEffect(
  generator: Iterable<number>,
  delayTime: number,
  sampleRate: number,
  feedback = 0.3,
  mix = 0.3,
) {
  const delaySamples = Math.floor(delayTime * sampleRate);
  const delayBuffer = new CircularBuffer(delaySamples);

  // Fill buffer with zeros initially
  for (let i = 0; i < delaySamples; i++) {
    delayBuffer.write(0);
  }

  for (const sample of generator) {
    // Read delayed sample
    const delayed = delayBuffer.read();

    // Write current sample + feedback to buffer
    delayBuffer.write(sample + delayed * feedback);

    // Output dry + wet mix
    yield sample + delayed * mix;
  }
}

// Chain multiple effects together
function* audioEffectChain(input: Iterable<number>, sampleRate: number) {
  // Start with the input signal
  let signal = input;

  // Add a short delay (slap-back echo)
  signal = delayEffect(signal, 0.08, sampleRate, 0.2, 0.15);

  // Add a longer delay (echo)
  signal = delayEffect(signal, 0.25, sampleRate, 0.3, 0.2);

  yield* signal;
}

function* echoEffect(
  input: Iterable<number>,
  sampleRate: number,
  delayTime = 0.3,
  decayFactor = 0.6,
  numEchoes = 4,
) {
  const delays = Array.from({ length: numEchoes }, (_, i) => {
    const delay = new CircularBuffer(
      Math.floor(delayTime * (i + 1) * sampleRate),
    );
    // Fill with zeros
    for (let j = 0; j < delay.bufferSize; j++) {
      delay.write(0);
    }
    return delay;
  });

  for (const sample of input) {
    let output = sample;

    // Add each echo tap
    for (let i = 0; i < delays.length; i++) {
      const delayed = delays[i].read();
      delays[i].write(sample);
      output += delayed * Math.pow(decayFactor, i + 1);
    }

    yield output;
  }
}

function* simpleReverb(
  input: Iterable<number>,
  sampleRate: number,
  roomSize = 0.8,
  wetMix = 0.3,
) {
  // Multiple delay lines with different lengths for reverb
  const delayTimes = [0.03, 0.05, 0.07, 0.09, 0.13, 0.17, 0.23];
  const delays = delayTimes.map((time) => {
    const buffer = new CircularBuffer(Math.floor(time * sampleRate));
    for (let i = 0; i < buffer.bufferSize; i++) {
      buffer.write(0);
    }
    return buffer;
  });

  for (const sample of input) {
    let reverbSum = 0;

    // Process each delay line
    for (const delay of delays) {
      const delayed = delay.read();
      delay.write(sample + delayed * roomSize * 0.1);
      reverbSum += delayed;
    }

    const reverb = reverbSum / delays.length;
    yield sample + reverb * wetMix;
  }
}

// Generate a test signal
function* generateTestTone(
  frequency: number,
  duration: number,
  sampleRate: number,
) {
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    yield Math.sin(2 * Math.PI * frequency * t) * 0.5;
  }
}

async function audioEffectsDemo() {
  const session = await startSession();

  try {
    const stream = await session.createAudioOutputStream({
      name: "Audio Effects Demo",
      quality: AudioQuality.Standard,
      channels: 1,
    });

    try {
      await stream.connect();
      console.log(`🎛️ Audio effects demo @ ${stream.rate}Hz`);

      // Generate a test tone
      const testSignal = generateTestTone(440, 2.0, stream.rate);

      console.log("🎵 Playing original signal...");
      await stream.write(testSignal);

      console.log("🔄 Adding delay effect...");
      const delayedSignal = delayEffect(
        generateTestTone(440, 2.0, stream.rate),
        0.2, // 200ms delay
        stream.rate,
        0.4, // 40% feedback
        0.3, // 30% wet mix
      );
      await stream.write(delayedSignal);

      console.log("📢 Adding echo effect...");
      const echoSignal = echoEffect(
        generateTestTone(440, 2.0, stream.rate),
        stream.rate,
        0.15, // 150ms between echoes
        0.5, // 50% decay
        3, // 3 echoes
      );
      await stream.write(echoSignal);

      console.log("🏛️ Adding reverb effect...");
      const reverbSignal = simpleReverb(
        generateTestTone(440, 2.0, stream.rate),
        stream.rate,
        0.7, // 70% room size
        0.4, // 40% wet mix
      );
      await stream.write(reverbSignal);

      console.log("🔗 Adding effect chain (slap-back + echo)...");
      const chainedSignal = audioEffectChain(
        generateTestTone(440, 2.0, stream.rate),
        stream.rate,
      );
      await stream.write(chainedSignal);

      console.log("✅ Audio effects demo complete!");
    } finally {
      await stream.dispose();
    }
  } finally {
    await session.dispose();
  }
}

// Run the demo
audioEffectsDemo().catch(console.error);
