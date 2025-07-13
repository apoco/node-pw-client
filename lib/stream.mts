export type Latency = {
  direction: "input" | "output";
  min: LatencyExtrema;
  max: LatencyExtrema;
};

type LatencyExtrema = {
  quantum: number;
  rate: number;
  nanoseconds: BigInt;
};

export enum StreamStateEnum {
  Error = -1,
  Unconnected = 0,
  Connecting = 1,
  Paused = 2,
  Streaming = 3,
}

export type StreamState =
  | "error"
  | "unconnected"
  | "connecting"
  | "paused"
  | "streaming";

export const streamStateToName: Record<StreamStateEnum, StreamState> = {
  [StreamStateEnum.Error]: "error",
  [StreamStateEnum.Unconnected]: "unconnected",
  [StreamStateEnum.Connecting]: "connecting",
  [StreamStateEnum.Paused]: "paused",
  [StreamStateEnum.Streaming]: "streaming",
};
