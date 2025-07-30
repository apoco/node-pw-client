[**pw-client**](../README.md)

***

# Interface: AudioOutputStreamOpts

Defined in: [audio-output-stream.mts:65](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L65)

Configuration options for creating audio output streams.
All options are optional with sensible defaults.

## Example

```typescript
const opts: AudioOutputStreamOpts = {
  name: "My Synthesizer",
  rate: 44100,
  channels: 2,
  quality: AudioQuality.High,
  role: "Music",
  enableMonitoring: true
};
```

## Properties

### name?

> `optional` **name**: `string`

Defined in: [audio-output-stream.mts:66](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L66)

Human-readable name displayed in PipeWire clients (default: "Node.js Audio")

***

### rate?

> `optional` **rate**: `number`

Defined in: [audio-output-stream.mts:67](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L67)

Sample rate in Hz (default: 48000)

***

### channels?

> `optional` **channels**: `number`

Defined in: [audio-output-stream.mts:68](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L68)

Number of audio channels (default: 2 for stereo)

***

### role?

> `optional` **role**: `"Movie"` \| `"Music"` \| `"Camera"` \| `"Screen"` \| `"Communication"` \| `"Game"` \| `"Notification"` \| `"DSP"` \| `"Production"` \| `"Accessibility"` \| `"Test"`

Defined in: [audio-output-stream.mts:69](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L69)

Audio role hint for PipeWire routing (default: "Music")

***

### quality?

> `optional` **quality**: [`AudioQuality`](../enumerations/AudioQuality.md)

Defined in: [audio-output-stream.mts:81](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L81)

Quality preset that affects format negotiation (default: AudioQuality.Standard)

***

### preferredFormats?

> `optional` **preferredFormats**: [`AudioFormat`](../classes/AudioFormat.md)[]

Defined in: [audio-output-stream.mts:82](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L82)

Override format negotiation order

***

### preferredRates?

> `optional` **preferredRates**: `number`[]

Defined in: [audio-output-stream.mts:83](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L83)

Override sample rate negotiation order

***

### autoConnect?

> `optional` **autoConnect**: `boolean`

Defined in: [audio-output-stream.mts:84](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L84)

Whether to auto-connect after creation (default: false)

***

### buffering?

> `optional` **buffering**: `BufferConfig`

Defined in: [audio-output-stream.mts:85](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L85)

Buffer configuration for performance optimization

***

### enableMonitoring?

> `optional` **enableMonitoring**: `boolean`

Defined in: [audio-output-stream.mts:86](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L86)

Enable performance monitoring and diagnostics (default: false)
