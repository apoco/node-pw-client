import { AudioFormat } from "./audio-format.mjs";

/**
 * Audio quality presets that balance performance and audio quality.
 * Quality affects the internal format negotiation order but users always
 * work with JavaScript Numbers (Float64).
 * The quality level determines the internal format negotiations for best performance.
 *
 * @enum AudioQuality
 *
 * @example
 * ```typescript
 * // For music production
 * const stream = await session.createAudioOutputStream({
 *   quality: AudioQuality.High
 * });
 *
 * // For games and general use
 * const stream = await session.createAudioOutputStream({
 *   quality: AudioQuality.Standard
 * });
 *
 * // For system sounds
 * const stream = await session.createAudioOutputStream({
 *   quality: AudioQuality.Efficient
 * });
 * ```
 */
export enum AudioQuality {
  /**
   * Highest quality audio with maximum precision.
   * Best for: Music production, mastering, critical listening
   * Performance: Highest CPU usage, best quality
   * Formats: Float64 → Float32 → Int32 → Int24_32 → Int16
   * Sample rates: 192kHz → 96kHz → 88.2kHz → 48kHz → 44.1kHz
   */
  High = "high",

  /**
   * Balanced quality and performance.
   * Best for: General music playback, games, most applications
   * Performance: Good balance of CPU usage and quality
   * Formats: Float32 → Float64 → Int16 → Int32
   * Sample rates: 48kHz → 44.1kHz → 96kHz → 88.2kHz → 32kHz
   */
  Standard = "standard",

  /**
   * Lower quality, optimized for performance.
   * Best for: Voice, system sounds, resource-constrained environments
   * Performance: Lowest CPU usage, acceptable quality
   * Formats: Int16 → Float32 → Float64 → Int32
   * Sample rates: 44.1kHz → 48kHz → 32kHz → 22.05kHz → 16kHz
   */
  Efficient = "efficient",
}

/**
 * Format preference mappings for each quality level.
 * Maps user-friendly quality levels to technical format negotiation order.
 */
const FORMAT_PREFERENCES: Record<AudioQuality, Array<AudioFormat>> = {
  [AudioQuality.High]: [
    AudioFormat.Float64, // Maximum precision for JavaScript Numbers
    AudioFormat.Float32, // Excellent quality, widely supported
    AudioFormat.Int32, // High precision integer
    AudioFormat.Int24_32, // Professional standard
    AudioFormat.Int16, // Fallback
  ],

  [AudioQuality.Standard]: [
    AudioFormat.Float32, // Best balance of quality and performance
    AudioFormat.Float64, // Higher quality if available
    AudioFormat.Int16, // Universal compatibility
    AudioFormat.Int32, // Fallback
  ],

  [AudioQuality.Efficient]: [
    AudioFormat.Int16, // Lowest CPU overhead
    AudioFormat.Float32, // Good quality if no performance impact
    AudioFormat.Float64, // Higher quality if system can handle it
    AudioFormat.Int32, // Fallback
  ],
};

/**
 * Sample rate preference mappings for each quality level.
 * Higher quality levels prefer higher sample rates when available.
 * All rates are common in professional and consumer audio.
 */
const RATE_PREFERENCES: Record<AudioQuality, Array<number>> = {
  [AudioQuality.High]: [
    192_000, // Ultra-high definition audio
    96_000, // High-resolution audio
    88_200, // DVD-Audio/hi-res standard
    48_000, // Professional standard
    44_100, // CD quality
  ],

  [AudioQuality.Standard]: [
    48_000, // Modern professional standard - best balance
    44_100, // CD quality - universal compatibility
    96_000, // High-res if available
    88_200, // Alternative hi-res
    32_000, // Fallback
  ],

  [AudioQuality.Efficient]: [
    44_100, // CD quality - good balance of quality/performance
    48_000, // Professional standard
    32_000, // Lower bandwidth
    22_050, // Voice/low quality acceptable
    16_000, // Minimum acceptable for most audio
  ],
};

/**
 * Get the optimal format preference order for a given quality level.
 * This internal function maps user-friendly quality levels to technical format negotiations.
 */
export function getFormatPreferences(
  quality: AudioQuality
): Array<AudioFormat> {
  return (
    FORMAT_PREFERENCES[quality] ?? FORMAT_PREFERENCES[AudioQuality.Standard]
  );
}

/**
 * Get the optimal sample rate preference order for a given quality level.
 * This internal function maps user-friendly quality levels to technical rate negotiations.
 */
export function getRatePreferences(quality: AudioQuality): Array<number> {
  return RATE_PREFERENCES[quality] ?? RATE_PREFERENCES[AudioQuality.Standard];
}
