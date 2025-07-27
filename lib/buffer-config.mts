/**
 * Buffer configuration and management for audio streams.
 * Provides both static and dynamic buffer sizing strategies.
 */

import { AudioQuality } from "./audio-quality.mjs";

/**
 * Buffer sizing strategy for audio streams.
 */
export enum BufferStrategy {
  /** Minimal latency (~5ms), smallest buffers (may cause underruns on slow systems) */
  MinimalLatency = "minimal-latency",
  /** Low latency (~10ms), good for real-time applications */
  LowLatency = "low-latency",
  /** Balanced latency and reliability (~20ms, recommended default) */
  Balanced = "balanced",
  /** Smooth playback (~40ms), maximum reliability against dropouts */
  Smooth = "smooth",
  /** User specifies target latency in milliseconds */
  MaxLatency = "max-latency",
  /** User specifies exact buffer size in bytes */
  MaxSize = "max-size",
  /** User specifies quantum multiplier (for PipeWire experts) */
  QuantumMultiplier = "quanta",
}

/**
 * Configuration for audio stream buffering behavior.
 */
export type BufferConfig =
  | { strategy: BufferStrategy.MinimalLatency }
  | { strategy: BufferStrategy.LowLatency }
  | { strategy: BufferStrategy.Balanced }
  | { strategy: BufferStrategy.Smooth }
  | { strategy: BufferStrategy.MaxLatency; milliseconds: number }
  | { strategy: BufferStrategy.MaxSize; bytes: number }
  | { strategy: BufferStrategy.QuantumMultiplier; multiplier: number };

/**
 * Get recommended buffer configuration for an audio quality level.
 * Returns user-friendly buffer strategies with appropriate latency settings.
 */
export function getBufferConfigForQuality(quality: AudioQuality): BufferConfig {
  switch (quality) {
    case AudioQuality.High:
      return { strategy: BufferStrategy.Smooth };
    case AudioQuality.Standard:
      return { strategy: BufferStrategy.Balanced };
    case AudioQuality.Efficient:
      return { strategy: BufferStrategy.LowLatency };
    default:
      return { strategy: BufferStrategy.Balanced };
  }
}
