import EventEmitter, { once } from "node:events";
import { AudioFormat, OutputBuffer } from "./audio-format.mjs";
import {
  AudioQuality,
  getFormatPreferences,
  getRatePreferences,
} from "./audio-quality.mjs";
import { NativePipeWireSession } from "./session.mjs";
import * as Props from "./props.mjs";
import { Latency, StreamState, streamStateToName } from "./stream.mjs";
import { adaptSamples } from "./format-negotiation.mjs";

export type NativeAudioOutputStream = {
  connect: (options?: {
    preferredFormats?: number[];
    preferredRates?: number[];
  }) => Promise<void>;
  disconnect: () => Promise<void>;
  get bufferSize(): number;
  write: (data: ArrayBuffer) => void;
  isReady: () => Promise<number>;
  isFinished: () => Promise<void>;
  destroy: () => Promise<void>;
};

export type AudioOutputStreamOpts = {
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
  preferredFormats?: AudioFormat[];
  preferredRates?: number[];
  autoConnect?: boolean;
};

export type AudioOutputStreamProps = {
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
};

type AudioEvents = {
  propsChange: [AudioOutputStreamProps];
  formatChange: [{ format: AudioFormat; channels: number; rate: number }];
  latencyChange: [Latency];
  unknownParamChange: [number];
  stateChange: [StreamState];
  error: [Error];
};

export interface AudioOutputStream extends EventEmitter<AudioEvents> {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  write: (samples: Iterable<number>) => Promise<void>;
  isFinished: () => Promise<void>;
  dispose: () => Promise<void>;
  get format(): AudioFormat;
  get channels(): number;
  get rate(): number;
  get isConnected(): boolean;
  [Symbol.asyncDispose]: () => Promise<void>;
}

export type TypedNumericArray = {
  [index: number]: number;
  buffer: ArrayBuffer;
  subarray(offset: number, length: number): TypedNumericArray;
};

export type TypedNumericArrayCtor = {
  new (size: number): TypedNumericArray;
};

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
    preferredFormats?: AudioFormat[];
    preferredRates?: number[];
  };
  #isConnected: boolean = false;
  #autoConnect: boolean = false;
  #formatNegotiated: boolean = false;

  #negotiatedFormat!: AudioFormat;
  #negotiatedChannels: number = 2;
  #negotiatedRate: number = 48_000;

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
    return session.createAudioOutputStream({
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
    this.#formatNegotiated = true;
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

    output && this.#nativeStream.write(output.subarray(0, offset).buffer);
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
