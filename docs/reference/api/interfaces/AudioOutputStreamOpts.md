[**pw-client**](../README.md)

***

# Interface: AudioOutputStreamOpts

Defined in: audio-output-stream.mts:54

Configuration options for creating audio output streams.
All options are optional with sensible defaults.

## Example

```typescript
const opts: AudioOutputStreamOpts = {
  name: "My Synthesizer",
  rate: 44100,
  channels: 2,
  quality: AudioQuality.High,
  role: "Music"
};
```

## Properties

### name?

> `optional` **name**: `string`

Defined in: audio-output-stream.mts:55

Human-readable name displayed in PipeWire clients (default: "Node.js Audio")

***

### rate?

> `optional` **rate**: `number`

Defined in: audio-output-stream.mts:56

Sample rate in Hz (default: 48000)

***

### channels?

> `optional` **channels**: `number`

Defined in: audio-output-stream.mts:57

Number of audio channels (default: 2 for stereo)

***

### role?

> `optional` **role**: `"Movie"` \| `"Music"` \| `"Camera"` \| `"Screen"` \| `"Communication"` \| `"Game"` \| `"Notification"` \| `"DSP"` \| `"Production"` \| `"Accessibility"` \| `"Test"`

Defined in: audio-output-stream.mts:58

Audio role hint for PipeWire routing (default: "Music")

***

### quality?

> `optional` **quality**: [`AudioQuality`](../enumerations/AudioQuality.md)

Defined in: audio-output-stream.mts:70

Quality preset that affects format negotiation (default: AudioQuality.Standard)

***

### preferredFormats?

> `optional` **preferredFormats**: [`AudioFormat`](../classes/AudioFormat.md)[]

Defined in: audio-output-stream.mts:71

Override format negotiation order

***

### preferredRates?

> `optional` **preferredRates**: `number`[]

Defined in: audio-output-stream.mts:72

Override sample rate negotiation order

***

### autoConnect?

> `optional` **autoConnect**: `boolean`

Defined in: audio-output-stream.mts:73

Whether to auto-connect after creation (default: false)
