/**
 * Shared audio utility functions for examples
 */

export function* generateSineWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3,
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    yield Math.sin(i * cycle * frequency) * volume;
  }
}

export function* generateNoise(
  duration: number,
  sampleRate: number,
  volume = 0.1,
) {
  const totalSamples = Math.floor(duration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    yield (Math.random() * 2 - 1) * volume;
  }
}

export function* generateSquareWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3,
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    yield (Math.sin(i * cycle * frequency) > 0 ? 1 : -1) * volume;
  }
}

export function* generateSawtoothWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3,
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    // Convert phase to sawtooth: rises from -1 to +1, then jumps back
    const normalized = ((i * cycle * frequency) / (Math.PI * 2)) % 1;
    yield (normalized * 2 - 1) * volume;
  }
}

export function* generateTriangleWave(
  frequency: number,
  duration: number,
  sampleRate: number,
  volume = 0.3,
) {
  const totalSamples = Math.floor(duration * sampleRate);
  const cycle = (Math.PI * 2) / sampleRate;

  for (let i = 0; i < totalSamples; i++) {
    const normalized = ((i * cycle * frequency) / (Math.PI * 2)) % 1;
    // Triangle: rises from 0 to 1, then falls from 1 to 0
    const triangle = normalized < 0.5 ? normalized * 2 : 2 - normalized * 2;
    yield (triangle * 2 - 1) * volume;
  }
}

// Simple delay effect
export function delay(delaySamples: number, feedback = 0.3, mix = 0.3) {
  const delayBuffer = new Array<number>(delaySamples).fill(0);
  let index = 0;

  return function (sample: number) {
    const delayed = delayBuffer[index];
    const output = sample + delayed * mix;

    delayBuffer[index] = sample + delayed * feedback;
    index = (index + 1) % delaySamples;

    return output;
  };
}

// Simple low-pass filter
export function lowPass(cutoff = 0.1) {
  let prev = 0;

  return function (sample: number) {
    prev = prev + (sample - prev) * cutoff;
    return prev;
  };
}
