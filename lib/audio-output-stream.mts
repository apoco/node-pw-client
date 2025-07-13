import EventEmitter from "node:events";
import { AudioFormat, OutputBufferFactory } from "./audio-format.mjs";
import { NativePipeWireSession } from "./session.mjs";
import * as Props from "./props.mjs";
import { Latency, StreamState, streamStateToName } from "./stream.mjs";

export type NativeAudioOutputStream = {
  connect: () => Promise<void>;
  get bufferSize(): number;
  write: (data: ArrayBuffer) => void;
  isReady: () => Promise<number>;
  isFinished: () => Promise<void>;
  destroy: () => Promise<void>;
};

export type AudioOutputStreamOpts = {
  name?: string;
  format?: AudioFormat;
  rate?: number;
  channels?: number;
  media?: {
    type?: "Audio" | "Video" | "Midi";
    category?: "Playback" | "Capture" | "Duplex" | "Monitor" | "Manager";
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
  };
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
  formatChange: [{ format: number; channels: number; rate: number }];
  latencyChange: [Latency];
  unknownParamChange: [number];
  stateChange: [StreamState];
  error: [Error];
};

export interface AudioOutputStream extends EventEmitter<AudioEvents> {
  connect: () => Promise<void>;
  write: (samples: Iterable<number>) => Promise<void>;
  isFinished: () => Promise<void>;
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
  #bufferFactory!: OutputBufferFactory;

  private constructor() {
    super();
  }

  async #init(
    session: NativePipeWireSession,
    {
      name = "PipeWireStream",
      format = AudioFormat.Float64,
      rate = 48_000,
      channels = 2,
      media = {},
    }: AudioOutputStreamOpts = {}
  ) {
    const props: Record<string, string> = {};
    if (media.type) {
      props[Props.Media.Type] = media.type;
    }
    if (media.category) {
      props[Props.Media.Category] = media.category;
    }
    if (media.role) {
      props[Props.Media.Role] = media.role;
    }

    this.#bufferFactory = format.BufferClass;
    this.#nativeStream = await session.createAudioOutputStream({
      name,
      format: format.enumValue,
      bytesPerSample: format.byteSize,
      rate,
      channels,
      props,
      onStateChange: (state, error) => {
        this.emit("stateChange", streamStateToName[state]);
        if (error) {
          this.emit("error", new Error(error));
        }
      },
      onLatencyChange: (latency) => this.emit("latencyChange", latency),
      onPropsChange: (props) => this.emit("propsChange", props),
      onUnknownParamChange: (param) => this.emit("unknownParamChange", param),
      onFormatChange: (format) => {
        const newFormat = AudioFormat.fromEnum(format.format);
        if (!newFormat) {
          throw new Error(`Unknown format: ${format.format}`);
        }
        this.#bufferFactory = newFormat.BufferClass;
        this.emit("formatChange", format);
      },
    });
  }

  connect() {
    return this.#nativeStream.connect();
  }

  async write(samples: Iterable<number>) {
    let chunkSize = this.#nativeStream.bufferSize;
    let output = this.#bufferFactory(chunkSize);
    let offset = 0;

    for (const sample of samples) {
      output.set(offset++, sample);
      if (offset >= chunkSize) {
        this.#nativeStream.write(output.buffer);
        chunkSize = await this.#nativeStream.isReady();
        output = this.#bufferFactory(chunkSize);
        offset = 0;
      }
    }

    if (offset) {
      this.#nativeStream.write(output.subarray(0, offset).buffer);
    }
  }

  isFinished() {
    return this.#nativeStream.isFinished();
  }

  [Symbol.asyncDispose]() {
    return this.#nativeStream.destroy();
  }
}
