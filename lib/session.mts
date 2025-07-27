import { createRequire } from "node:module";
import {
  AudioOutputStreamImpl,
  type NativeAudioOutputStream,
  type AudioOutputStream,
  type AudioOutputStreamOpts,
  type AudioOutputStreamProps,
} from "./audio-output-stream.mjs";
import type { Latency, StreamStateEnum } from "./stream.mjs";

const require = createRequire(import.meta.url);
const { PipeWireSession: NativePipeWireSession } =
  require("../build/Debug/pipewire.node") as NativeModule;

interface NativeModule {
  PipeWireSession: new () => NativePipeWireSession;
  startSession: () => Promise<NativePipeWireSession>;
}

export interface NativePipeWireSession {
  start: () => Promise<void>;
  createAudioOutputStream: (opts: {
    name: string;
    format: number;
    bytesPerSample: number;
    rate: number;
    channels: number;
    buffering?: {
      requestedQuanta?: number;
      requestedBytes?: number;
      requestedMs?: number;
    };
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
}

/**
 * PipeWire session that manages the connection to the PipeWire audio server.
 *
 * Sessions coordinate with PipeWire to create and manage audio streams.
 * They must be properly disposed to prevent resource leaks.
 *
 * Use `startSession()` to create new instances rather than constructing directly.
 *
 * @example
 * ```typescript
 * const session = await startSession();
 * const stream = await session.createAudioOutputStream({
 *   name: "My Audio App",
 *   quality: AudioQuality.Standard
 * });
 *
 * // Always dispose when done
 * await session.dispose();
 * ```
 */
export class PipeWireSession {
  readonly #nativeSession: NativePipeWireSession;

  /**
   * Creates and starts a new PipeWire session.
   * @internal Use `startSession()` function instead
   */
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

  /**
   * Creates a new audio output stream.
   *
   * @param opts - Stream configuration options (all optional)
   * @returns Promise resolving to AudioOutputStream instance
   * @throws Will reject if session is disposed or stream creation fails
   *
   * @example
   * ```typescript
   * const stream = await session.createAudioOutputStream({
   *   name: "My Audio App",
   *   quality: AudioQuality.Standard,
   *   channels: 2
   * });
   * ```
   */
  createAudioOutputStream(
    opts?: AudioOutputStreamOpts
  ): Promise<AudioOutputStream> {
    if (!this.#nativeSession) {
      throw new Error("Session has been disposed");
    }
    return AudioOutputStreamImpl.create(this.#nativeSession, opts);
  }

  /**
   * Disposes the session and releases PipeWire resources.
   *
   * After calling dispose(), the session cannot be used again.
   * All streams created by this session will be invalidated.
   *
   * @returns Promise that resolves when cleanup is complete
   */
  async dispose() {
    if (this.#nativeSession) {
      await this.#nativeSession.destroy();
    }
  }

  /**
   * Automatic resource cleanup for `await using` syntax.
   * @see dispose
   */
  [Symbol.asyncDispose]() {
    return this.dispose();
  }
}

/**
 * Creates and starts a new PipeWire session.
 *
 * This is the main entry point for the pw-client API. Sessions manage
 * connections to the PipeWire audio server and create audio streams.
 *
 * @returns Promise resolving to a started PipeWireSession
 * @throws Will reject if PipeWire connection fails or daemon unavailable
 *
 * @example
 * ```typescript
 * // Manual resource management
 * const session = await startSession();
 * try {
 *   // Use session...
 * } finally {
 *   await session.dispose();
 * }
 *
 * // Automatic cleanup (Node.js 22+)
 * await using session = await startSession();
 * ```
 */
export async function startSession() {
  return await PipeWireSession.start();
}
