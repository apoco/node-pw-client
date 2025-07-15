import { AudioFormat } from "./audio-format.mjs";

/**
 * Sample converter functions for each audio format.
 * null indicates no conversion needed (identity function).
 */
const SAMPLE_CONVERTERS = new Map<
  AudioFormat,
  ((sample: number) => number) | null
>([
  [AudioFormat.Float64, null], // No conversion needed

  [AudioFormat.Float32, null], // Float32Array constructor handles this

  [
    AudioFormat.Int16,
    (sample: number) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      return Math.round(clamped * 32767);
    },
  ],

  [
    AudioFormat.Int32,
    (sample: number) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      return Math.round(clamped * 2147483647);
    },
  ],

  [
    AudioFormat.Uint16,
    (sample: number) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      return Math.round((clamped + 1) * 32767.5);
    },
  ],

  [
    AudioFormat.Int8,
    (sample: number) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      return Math.round(clamped * 127);
    },
  ],

  [
    AudioFormat.Uint8,
    (sample: number) => {
      const clamped = Math.max(-1, Math.min(1, sample));
      return Math.round((clamped + 1) * 127.5);
    },
  ],
]);

/**
 * Automatic sample converter that adapts Float64 streams to target format.
 * Returns the original iterable if no conversion is needed for optimal performance.
 */
export function adaptSamples(
  samples: Iterable<number>,
  targetFormat: AudioFormat
): Iterable<number> {
  const converter = SAMPLE_CONVERTERS.get(targetFormat) ?? null;

  // No conversion needed - return original iterable for maximum efficiency
  if (converter === null) {
    return samples;
  }

  // Conversion needed - return generator that applies the converter
  return (function* () {
    for (const sample of samples) {
      yield converter(sample);
    }
  })();
}
