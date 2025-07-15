import { AudioFormat } from "./audio-format.mjs";

/**
 * Audio quality levels that map to optimal format preferences.
 * Users work with JavaScript Numbers (Float64) regardless of quality level.
 * The quality level determines the internal format negotiations for best performance.
 */
export enum AudioQuality {
  /**
   * Highest quality audio with maximum precision.
   * Best for: Music production, mastering, critical listening
   * Performance: Highest CPU usage, best quality
   * Formats: Float64 → Float32 → Int32 → Int16
   */
  High = "high",

  /**
   * Balanced quality and performance.
   * Best for: General music playback, games, most applications
   * Performance: Good balance of CPU usage and quality
   * Formats: Float32 → Float64 → Int16 → Int32
   */
  Standard = "standard",

  /**
   * Lower quality, optimized for performance.
   * Best for: Voice, system sounds, resource-constrained environments
   * Performance: Lowest CPU usage, acceptable quality
   * Formats: Int16 → Float32 → Float64 → Int32
   */
  Efficient = "efficient",
}

/**
 * Format preference mappings for each quality level.
 * Maps user-friendly quality levels to technical format negotiation order.
 */
const FORMAT_PREFERENCES = new Map<AudioQuality, AudioFormat[]>([
  [
    AudioQuality.High,
    [
      AudioFormat.Float64, // Maximum precision for JavaScript Numbers
      AudioFormat.Float32, // Excellent quality, widely supported
      AudioFormat.Int32, // High precision integer
      AudioFormat.Int24_32, // Professional standard
      AudioFormat.Int16, // Fallback
    ],
  ],

  [
    AudioQuality.Standard,
    [
      AudioFormat.Float32, // Best balance of quality and performance
      AudioFormat.Float64, // Higher quality if available
      AudioFormat.Int16, // Universal compatibility
      AudioFormat.Int32, // Fallback
    ],
  ],

  [
    AudioQuality.Efficient,
    [
      AudioFormat.Int16, // Lowest CPU overhead
      AudioFormat.Float32, // Good quality if no performance impact
      AudioFormat.Float64, // Higher quality if system can handle it
      AudioFormat.Int32, // Fallback
    ],
  ],
]);

/**
 * Sample rate preference mappings for each quality level.
 * Higher quality levels prefer higher sample rates when available.
 * All rates are common in professional and consumer audio.
 */
const RATE_PREFERENCES = new Map<AudioQuality, number[]>([
  [
    AudioQuality.High,
    [
      192_000, // Ultra-high definition audio
      96_000, // High-resolution audio
      88_200, // DVD-Audio/hi-res standard
      48_000, // Professional standard
      44_100, // CD quality
    ],
  ],

  [
    AudioQuality.Standard,
    [
      48_000, // Modern professional standard - best balance
      44_100, // CD quality - universal compatibility
      96_000, // High-res if available
      88_200, // Alternative hi-res
      32_000, // Fallback
    ],
  ],

  [
    AudioQuality.Efficient,
    [
      44_100, // CD quality - good balance of quality/performance
      48_000, // Professional standard
      32_000, // Lower bandwidth
      22_050, // Voice/low quality acceptable
      16_000, // Minimum acceptable for most audio
    ],
  ],
]);

/**
 * Get the optimal format preference order for a given quality level.
 * This internal function maps user-friendly quality levels to technical format negotiations.
 */
export function getFormatPreferences(quality: AudioQuality): AudioFormat[] {
  return (
    FORMAT_PREFERENCES.get(quality) ??
    FORMAT_PREFERENCES.get(AudioQuality.Standard)!
  );
}

/**
 * Get the optimal sample rate preference order for a given quality level.
 * This internal function maps user-friendly quality levels to technical rate negotiations.
 */
export function getRatePreferences(quality: AudioQuality): number[] {
  return (
    RATE_PREFERENCES.get(quality) ??
    RATE_PREFERENCES.get(AudioQuality.Standard)!
  );
}
