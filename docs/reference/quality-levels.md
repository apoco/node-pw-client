# Quality Level Specifications

Technical details and specifications for each audio quality level in the PipeWire Node.js Client.

## Quality Level Overview

| Quality     | Format Priority                              | Sample Rate Priority                      | Typical Negotiated    | CPU Usage | Best For             |
| ----------- | -------------------------------------------- | ----------------------------------------- | --------------------- | --------- | -------------------- |
| `High`      | Float64 → Float32 → Int32 → Int24_32 → Int16 | 192000 → 96000 → 88200 → 48000 → 44100 Hz | Float32 44.1kHz-96kHz | High      | Professional audio   |
| `Standard`  | Float32 → Float64 → Int16 → Int32            | 48000 → 44100 → 96000 → 88200 → 32000 Hz  | Float32 44.1kHz-48kHz | Medium    | General applications |
| `Efficient` | Int16 → Float32 → Float64 → Int32            | 44100 → 48000 → 32000 → 22050 → 16000 Hz  | Int16 44.1kHz         | Low       | System sounds, voice |

## Supported Audio Formats

Complete technical specifications for all PipeWire audio formats supported by this library:

| Format   | Total Bits | Precision | Dynamic Range | Memory/Sample | Best For                    |
| -------- | ---------- | --------- | ------------- | ------------- | --------------------------- |
| Float64  | 64-bit     | 52-bit    | ~144+ dB      | 8 bytes       | Ultimate precision/analysis |
| Float32  | 32-bit     | 23-bit    | ~138 dB       | 4 bytes       | Professional audio          |
| Int32    | 32-bit     | 31-bit    | ~192 dB       | 4 bytes       | Ultra-high precision        |
| Int24_32 | 24-bit     | 23-bit    | ~144 dB       | 4 bytes       | Professional standard       |
| Int16    | 16-bit     | 15-bit    | ~96 dB        | 2 bytes       | CD-quality, efficiency      |

### Technical Notes

- **Precision**: Effective bits contributing to audio resolution (mantissa for floats, total-1 for signed integers)
- **Dynamic Range**: Theoretical signal-to-noise ratio in decibels
- **All formats**: JavaScript input is always normalized -1.0 to +1.0 range

## Supported Sample Rates

All sample rates supported by PipeWire and this library:

| Sample Rate | Description                 | Use Case                      | CPU Impact |
| ----------- | --------------------------- | ----------------------------- | ---------- |
| 192000 Hz   | Ultra-high professional     | High-end mastering, analysis  | Very High  |
| 96000 Hz    | High-end professional audio | Studio recording, mastering   | High       |
| 88200 Hz    | High professional rate      | DVD-Audio, professional work  | High       |
| 48000 Hz    | Professional standard       | Most professional audio       | Medium     |
| 44100 Hz    | CD audio standard           | Consumer audio, compatibility | Low        |
| 32000 Hz    | Digital broadcast standard  | DAB, some streaming formats   | Low        |
| 22050 Hz    | Half CD rate                | Low-bandwidth applications    | Very Low   |
| 16000 Hz    | Wideband speech             | Voice communication, VoIP     | Very Low   |
| 8000 Hz     | Telephony quality           | Basic voice communication     | Minimal    |

### Technical Notes

- **Higher rates**: Better frequency response, more CPU intensive
- **Standard rates**: 44.1kHz and 48kHz are most widely supported
- **Professional preference**: 48kHz is preferred for new professional work
- **Compatibility**: 44.1kHz offers best compatibility across devices

### Sample Rate and Frequency Response Explained

**Frequency response** refers to the range of audio frequencies (pitches) that can be accurately captured and reproduced. Sample rate directly determines this range through the **Nyquist theorem**: the maximum representable frequency is half the sample rate.

**Why this matters for audio quality:**

- **Human hearing range**: ~20 Hz to 20,000 Hz (20 kHz)
- **44.1 kHz sample rate**: Can represent up to ~22 kHz (covers full human hearing range)
- **48 kHz sample rate**: Can represent up to ~24 kHz (extra headroom for processing)
- **Higher rates**: Allow better anti-aliasing filters and more processing headroom

**Real-world frequency examples:**

- **Bass frequencies**: 20-250 Hz (kick drums, bass guitar, low piano notes)
- **Midrange**: 250-4,000 Hz (most vocals, guitars, important for speech clarity)
- **High frequencies**: 4,000-20,000 Hz (cymbals, violin harmonics, vocal sibilants, "air" and "sparkle")

**Practical implications:**

- **8 kHz (telephony)**: Cuts off at 4 kHz, loses most high-frequency content, sounds muffled
- **16 kHz (wideband speech)**: Cuts off at 8 kHz, good for speech but loses musical highs
- **44.1 kHz (CD quality)**: Captures full human hearing range, excellent for music
- **48+ kHz (professional)**: Provides headroom for processing without aliasing artifacts

## Format Conversion Details

### Audio Dynamic Range Explained

**Dynamic range** refers to the ratio between the largest and smallest representable signal levels, expressed in decibels (dB). This is about **resolution** and **precision**, not absolute loudness:

- **Higher bit depth** = more steps between silence and maximum signal
- **More precision** = finer gradations, lower quantization noise
- **Actual loudness** is controlled by amplification, not bit depth

For example:

- 16-bit: ~65,536 discrete levels between -1.0 and +1.0
- 24-bit: ~16.7 million discrete levels in the same range
- 32-bit float: ~8.4 million usable levels with extended dynamic range

### JavaScript Number to Audio Format

All audio samples start as JavaScript `Number` values (IEEE 754 double-precision) and are automatically converted to the negotiated audio format.

**Conversion Details**: For implementation specifics, see the conversion functions in [`src/audio-output-stream.cpp`](../../src/audio-output-stream.cpp).

## Related Guides

- **[Choose the Right Audio Quality](../how-to-guides/choose-audio-quality.md)** - Select optimal quality levels for your use case
- **[Test Negotiated Audio Formats](../how-to-guides/test-negotiated-formats.md)** - Verify format negotiation behavior
- **[Monitor Performance](../how-to-guides/monitor-performance.md)** - Track performance metrics across quality levels
