import EventEmitter, { once } from "node:events";
import { AudioFormat, type OutputBuffer } from "./audio-format.mjs";
import {
  AudioQuality,
  getFormatPreferences,
  getRatePreferences,
} from "./audio-quality.mjs";
import type { NativePipeWireSession } from "./session.mjs";
import * as Props from "./props.mjs";
import {
  type Latency,
  type StreamState,
  streamStateToName,
} from "./stream.mjs";
import { adaptSamples } from "./format-negotiation.mjs";

export interface NativeAudioOutputStream {
  connect: (options?: {
    preferredFormats?: Array<number>;
    preferredRates?: Array<number>;
  }) => Promise<void>;
  disconnect: () => Promise<void>;
  get bufferSize(): number;
  write: (data: ArrayBuffer) => void;
  isReady: () => Promise<number>;
  isFinished: () => Promise<void>;
  destroy: () => Promise<void>;
}

/**
 * Configuration options for creating audio output streams.
 * All options are optional with sensible defaults.
 *
 * @property name - Human-readable name displayed in PipeWire clients (default: "Node.js Audio")
 * @property rate - Sample rate in Hz (default: 48000)
 * @property channels - Number of audio channels (default: 2 for stereo)
 * @property role - Audio role hint for PipeWire routing (default: "Music")
 * @property quality - Quality preset that affects format negotiation (default: AudioQuality.Standard)
 * @property preferredFormats - Override format negotiation order
 * @property preferredRates - Override sample rate negotiation order
 * @property autoConnect - Whether to auto-connect after creation (default: false)
 *
 * @example
 * ```typescript
 * const opts: AudioOutputStreamOpts = {
 *   name: "My Synthesizer",
 *   rate: 44100,
 *   channels: 2,
 *   quality: AudioQuality.High,
 *   role: "Music"
 * };
 * ```
 */
export interface AudioOutputStreamOpts {
  name?: string;
  rate?: number;
  channels?: number;
  role?:
    | "Movie"
    | "Music"
    | "Camera"
    | "Screen"
    | "Communication"
    | "Game"
    | "Notification"
    | "DSP"
    | "Production"
    | "Accessibility"
    | "Test";
  quality?: AudioQuality;
  preferredFormats?: Array<AudioFormat>;
  preferredRates?: Array<number>;
  autoConnect?: boolean;
}

export interface AudioOutputStreamProps {
  volume: number;
  mute: boolean;
  monitorMute: boolean;
  softMute: boolean;
  channels: Array<{
    id: number;
    volume: number;
    mute: boolean;
    monitorVolume: number;
    softVolume: number;
  }>;
  params: Record<string, unknown>;
}

interface AudioEvents {
  propsChange: [AudioOutputStreamProps];
  formatChange: [{ format: AudioFormat; channels: number; rate: number }];
  latencyChange: [Latency];
  unknownParamChange: [number];
  stateChange: [StreamState];
  error: [Error];
}

/**
 * Audio output stream for playing audio samples to PipeWire.
 * Streams are event emitters that provide real-time feedback about format changes,
 * latency updates, and connection state.
 *
 * @interface AudioOutputStream
 * @extends EventEmitter
 *
 * @example
 * ```typescript
 * const stream = await session.createAudioOutputStream({
 *   name: "Audio Generator",
 *   channels: 2,
 *   quality: AudioQuality.High
 * });
 *
 * await stream.connect();
 * await stream.write(audioSamples);
 * await stream.disconnect();
 * ```
 *
 * ## Events
 *
 * AudioOutputStream emits the following events:
 *
 * ### `formatChange`
 * Emitted when the stream's audio format is negotiated or changes.
 *
 * **Event payload:** `{ format: AudioFormat, channels: number, rate: number }`
 *
 * ```typescript
 * stream.on('formatChange', ({ format, channels, rate }) => {
 *   console.log(`Format: ${format.description}, ${channels}ch @ ${rate}Hz`);
 * });
 * ```
 *
 * ### `stateChange`
 * Emitted when the stream's connection state changes.
 *
 * **Event payload:** `StreamState` (string: "error", "unconnected", "connecting", "paused", "streaming")
 *
 * ```typescript
 * stream.on('stateChange', (state) => {
 *   console.log(`Stream state: ${state}`);
 * });
 * ```
 *
 * ### `latencyChange`
 * Emitted when the stream's latency information updates.
 *
 * **Event payload:** `{ min: number, max: number, default: number }` (all values in nanoseconds)
 *
 * ```typescript
 * stream.on('latencyChange', ({ min, max, default: def }) => {
 *   console.log(`Latency: ${def/1000000}ms (range: ${min/1000000}-${max/1000000}ms)`);
 * });
 * ```
 *
 * ### `propsChange`
 * Emitted when stream properties (volume, mute, etc.) change.
 *
 * **Event payload:** `AudioOutputStreamProps`
 *
 * ```typescript
 * stream.on('propsChange', (props) => {
 *   console.log(`Volume: ${props.volume}, Muted: ${props.mute}`);
 * });
 * ```
 *
 * ### `error`
 * Emitted when an error occurs during streaming.
 *
 * **Event payload:** `Error`
 *
 * ```typescript
 * stream.on('error', (error) => {
 *   console.error('Stream error:', error.message);
 * });
 * ```
 *
 * ### `unknownParamChange`
 * Emitted when PipeWire sends an unrecognized parameter change.
 *
 * **Event payload:** `number` (parameter ID)
 *
 * ```typescript
 * stream.on('unknownParamChange', (paramId) => {
 *   console.log(`Unknown parameter changed: ${paramId}`);
 * });
 * ```
 */
export interface AudioOutputStream extends EventEmitter<AudioEvents> {
  /**
   * Connect the stream to PipeWire audio system.
   * Triggers format negotiation and initializes audio processing.
   */
  connect: () => Promise<void>;

  /**
   * Disconnect the stream from PipeWire.
   * Stops audio processing and releases resources.
   */
  disconnect: () => Promise<void>;

  /**
   * Write audio samples to the stream.
   * Samples are JavaScript Numbers (-1.0 to 1.0) converted to negotiated format.
   */
  write: (samples: Iterable<number>) => Promise<void>;

  /**
   * Wait for all buffered audio to finish playing.
   * Useful for ensuring complete playback before cleanup.
   */
  isFinished: () => Promise<void>;

  /**
   * Dispose of the stream and release all resources.
   * Alternative to disconnect() for final cleanup.
   */
  dispose: () => Promise<void>;

  /**
   * Get the negotiated audio format after connection.
   * Available only after successful connect().
   */
  get format(): AudioFormat;

  /**
   * Get the negotiated number of audio channels.
   * Available only after successful connect().
   */
  get channels(): number;

  /**
   * Get the negotiated sample rate in Hz.
   * Available only after successful connect().
   */
  get rate(): number;

  /**
   * Check if the stream is currently connected to PipeWire.
   */
  get isConnected(): boolean;

  /**
   * Automatic resource cleanup for `await using` syntax.
   * Equivalent to calling dispose().
   */
  [Symbol.asyncDispose]: () => Promise<void>;
}

export interface TypedNumericArray {
  [index: number]: number;
  buffer: ArrayBuffer;
  subarray(offset: number, length: number): TypedNumericArray;
}

export type TypedNumericArrayCtor = new (size: number) => TypedNumericArray;

export class AudioOutputStreamImpl
  extends EventEmitter<AudioEvents>
  implements AudioOutputStream
{
  static async create(
    session: NativePipeWireSession,
    opts?: AudioOutputStreamOpts
  ): Promise<AudioOutputStream> {
    const stream = new AudioOutputStreamImpl();
    await stream.#init(session, opts);
    return stream;
  }

  #nativeStream!: NativeAudioOutputStream;
  #connectionConfig!: {
    quality: AudioQuality;
    preferredFormats?: Array<AudioFormat>;
    preferredRates?: Array<number>;
  };
  #isConnected = false;
  #autoConnect = false;

  #negotiatedFormat!: AudioFormat;
  #negotiatedChannels = 2;
  #negotiatedRate = 48_000;

  private constructor() {
    super();
  }

  async #init(
    session: NativePipeWireSession,
    opts: AudioOutputStreamOpts = {}
  ) {
    const {
      name = "PipeWireStream",
      rate = 48_000,
      channels = 2,
      role,
      quality = AudioQuality.Standard,
      preferredFormats,
      preferredRates,
      autoConnect = false,
    } = opts;

    this.#autoConnect = autoConnect;
    this.#connectionConfig = { quality, preferredFormats, preferredRates };
    this.#nativeStream = await this.#createNativeStream(session, {
      name,
      rate,
      channels,
      props: this.#buildMediaProps(role),
    });
  }

  #buildMediaProps(role?: string) {
    const props: Record<string, string> = {
      [Props.Media.Type]: "Audio",
      [Props.Media.Category]: "Playback",
    };

    if (role) {
      props[Props.Media.Role] = role;
    }

    return props;
  }

  async #createNativeStream(
    session: NativePipeWireSession,
    config: {
      name: string;
      rate: number;
      channels: number;
      props: Record<string, string>;
    }
  ) {
    return await session.createAudioOutputStream({
      name: config.name,
      format: AudioFormat.Float64.enumValue,
      bytesPerSample: AudioFormat.Float64.byteSize,
      rate: config.rate,
      channels: config.channels,
      props: config.props,
      onStateChange: (state, error) => {
        this.emit("stateChange", streamStateToName[state]);
        if (error) {
          this.emit("error", new Error(error));
        }
      },
      onLatencyChange: (latency) => this.emit("latencyChange", latency),
      onPropsChange: (props) => this.emit("propsChange", props),
      onUnknownParamChange: (param) => this.emit("unknownParamChange", param),
      onFormatChange: (format) => this.#handleFormatChange(format),
    });
  }

  #handleFormatChange(format: {
    format: number;
    channels: number;
    rate: number;
  }) {
    const newFormat = AudioFormat.fromEnum(format.format);
    if (!newFormat) {
      throw new Error(`Unknown format: ${format.format}`);
    }

    // Update negotiated format info
    this.#negotiatedFormat = newFormat;
    this.#negotiatedChannels = format.channels;
    this.#negotiatedRate = format.rate;

    // Emit format change event with AudioFormat object
    this.emit("formatChange", {
      format: newFormat,
      channels: format.channels,
      rate: format.rate,
    });
  }

  async connect() {
    if (this.#isConnected) {
      return; // Already connected
    }

    const preferredFormats =
      this.#connectionConfig.preferredFormats ??
      getFormatPreferences(this.#connectionConfig.quality);

    const preferredRates =
      this.#connectionConfig.preferredRates ??
      getRatePreferences(this.#connectionConfig.quality);

    // If format already negotiated, we can reuse it
    const formatNegotiation =
      !this.#negotiatedFormat && once(this, "formatChange");

    await this.#nativeStream.connect({
      preferredFormats: preferredFormats.map((f) => f.enumValue),
      preferredRates,
    });

    await formatNegotiation;
    this.#isConnected = true;
  }

  async disconnect() {
    if (!this.#isConnected) {
      return; // Already disconnected
    }

    await this.#nativeStream.disconnect();
    this.#isConnected = false;
  }

  get isConnected(): boolean {
    return this.#isConnected;
  }

  async write(samples: Iterable<number>) {
    if (!this.#isConnected && this.#autoConnect) {
      await this.connect();
    }

    // Check if connected
    if (!this.#isConnected) {
      throw new Error(
        "Stream must be connected before writing audio data. Call await stream.connect() first."
      );
    }

    if (this.#negotiatedFormat !== AudioFormat.Float64) {
      samples = adaptSamples(samples, this.#negotiatedFormat);
    }

    const bytesPerSample = this.#negotiatedFormat.byteSize;
    let availableBytes = 0;
    let numChunks = 0;
    let offset = 0;
    let output: OutputBuffer | null = null;

    for (const sample of samples) {
      if (offset >= numChunks && output) {
        this.#nativeStream.write(output.subarray(0, offset).buffer);
        output = null;
      }

      if (!output) {
        availableBytes = await this.#nativeStream.isReady();
        numChunks = Math.floor(availableBytes / bytesPerSample);
        output = this.#negotiatedFormat.BufferClass(numChunks);
        offset = 0;
      }

      output.set(offset++, sample);
    }

    if (output) {
      this.#nativeStream.write(output.subarray(0, offset).buffer);
    }
  }

  isFinished() {
    return this.#nativeStream.isFinished();
  }

  get format(): AudioFormat {
    return this.#negotiatedFormat;
  }

  get channels(): number {
    return this.#negotiatedChannels;
  }

  get rate(): number {
    return this.#negotiatedRate;
  }

  async dispose() {
    await this.#nativeStream.destroy();
    this.#isConnected = false;
  }

  [Symbol.asyncDispose]() {
    return this.dispose();
  }
}
