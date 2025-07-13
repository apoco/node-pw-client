export enum StreamParam {
  /** property information as SPA_TYPE_OBJECT_PropInfo */
  PropInfo = 1,
  /** properties as SPA_TYPE_OBJECT_Props */
  Props = 2,
  /** available formats as SPA_TYPE_OBJECT_Format */
  EnumFormat = 3,
  /** configured format as SPA_TYPE_OBJECT_Format */
  Format = 4,
  /** buffer configurations as SPA_TYPE_OBJECT_ParamBuffers */
  Buffers = 5,
  /** allowed metadata for buffers as SPA_TYPE_OBJECT_ParamMeta */
  Meta = 6,
  /** configurable IO areas as SPA_TYPE_OBJECT_ParamIO */
  IO = 7,
  /** profile enumeration as SPA_TYPE_OBJECT_ParamProfile */
  EnumProfile = 8,
  /** profile configuration as SPA_TYPE_OBJECT_ParamProfile */
  Profile = 9,
  /** port configuration enumeration as SPA_TYPE_OBJECT_ParamPortConfig */
  EnumPortConfig = 10,
  /** port configuration as SPA_TYPE_OBJECT_ParamPortConfig */
  PortConfig = 11,
  /** routing enumeration as SPA_TYPE_OBJECT_ParamRoute */
  EnumRoute = 12,
  /** routing configuration as SPA_TYPE_OBJECT_ParamRoute */
  Route = 13,
  /** Control parameter, a SPA_TYPE_Sequence. */
  Control = 14,
  /** latency reporting, a SPA_TYPE_OBJECT_ParamLatency */
  Latency = 15,
  /** processing latency, a SPA_TYPE_OBJECT_ParamProcessLatency */
  ProcessLatency = 16,
  /** tag reporting, a SPA_TYPE_OBJECT_ParamTag. */
  Tag = 17,
}
