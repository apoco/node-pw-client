import { createRequire } from "node:module";
import {
  NativeAudioOutputStream,
  AudioOutputStream,
  AudioOutputStreamImpl,
  AudioOutputStreamOpts,
  AudioOutputStreamProps,
} from "./audio-output-stream.mjs";
import { Latency, StreamStateEnum } from "./stream.mjs";

const require = createRequire(import.meta.url);
const { PipeWireSession: NativePipeWireSession } =
  require("../build/Debug/pipewire.node") as NativeModule;

type NativeModule = {
  PipeWireSession: { new (): NativePipeWireSession };
  startSession: () => Promise<NativePipeWireSession>;
};

export type NativePipeWireSession = {
  start: () => Promise<void>;
  createAudioOutputStream: (opts: {
    name: string;
    format: number;
    bytesPerSample: number;
    rate: number;
    channels: number;
    props: Record<string, string>;
    onStateChange: (state: StreamStateEnum, error: string) => void;
    onPropsChange: (props: AudioOutputStreamProps) => void;
    onFormatChange: (format: {
      format: number;
      channels: number;
      rate: number;
    }) => void;
    onLatencyChange: (latency: Latency) => void;
    onUnknownParamChange: (param: number) => void;
  }) => Promise<NativeAudioOutputStream>;
  destroy: () => Promise<void>;
};

export class PipeWireSession {
  #nativeSession: NativePipeWireSession;

  static async start() {
    const session = new PipeWireSession();
    await session.#start();
    return session;
  }

  private constructor() {
    this.#nativeSession = new NativePipeWireSession();
  }

  #start() {
    return this.#nativeSession.start();
  }

  createAudioOutputStream(
    opts?: AudioOutputStreamOpts
  ): Promise<AudioOutputStream> {
    return AudioOutputStreamImpl.create(this.#nativeSession, opts);
  }

  [Symbol.asyncDispose]() {
    return this.#nativeSession.destroy();
  }
}

export async function startSession() {
  return PipeWireSession.start();
}
