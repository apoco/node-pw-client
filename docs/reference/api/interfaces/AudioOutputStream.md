[**pw-client**](../README.md)

***

# Interface: AudioOutputStream

Defined in: [audio-output-stream.mts:205](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L205)

Audio output stream for playing audio samples to PipeWire.
Streams are event emitters that provide real-time feedback about format changes,
latency updates, and connection state.

 AudioOutputStream

## Example

```typescript
const stream = await session.createAudioOutputStream({
  name: "Audio Generator",
  channels: 2,
  quality: AudioQuality.High
});

await stream.connect();
await stream.write(audioSamples);
await stream.disconnect();
```

## Events

AudioOutputStream emits the following events:

### `formatChange`
Emitted when the stream's audio format is negotiated or changes.

**Event payload:** `{ format: AudioFormat, channels: number, rate: number }`

```typescript
stream.on('formatChange', ({ format, channels, rate }) => {
  console.log(`Format: ${format.description}, ${channels}ch @ ${rate}Hz`);
});
```

### `stateChange`
Emitted when the stream's connection state changes.

**Event payload:** `StreamState` (string: "error", "unconnected", "connecting", "paused", "streaming")

```typescript
stream.on('stateChange', (state) => {
  console.log(`Stream state: ${state}`);
});
```

### `latencyChange`
Emitted when the stream's latency information updates.

**Event payload:** `{ min: number, max: number, default: number }` (all values in nanoseconds)

```typescript
stream.on('latencyChange', ({ min, max, default: def }) => {
  console.log(`Latency: ${def/1000000}ms (range: ${min/1000000}-${max/1000000}ms)`);
});
```

### `propsChange`
Emitted when stream properties (volume, mute, etc.) change.

**Event payload:** `AudioOutputStreamProps`

```typescript
stream.on('propsChange', (props) => {
  console.log(`Volume: ${props.volume}, Muted: ${props.mute}`);
});
```

### `error`
Emitted when an error occurs during streaming.

**Event payload:** `Error`

```typescript
stream.on('error', (error) => {
  console.error('Stream error:', error.message);
});
```

### `unknownParamChange`
Emitted when PipeWire sends an unrecognized parameter change.

**Event payload:** `number` (parameter ID)

```typescript
stream.on('unknownParamChange', (paramId) => {
  console.log(`Unknown parameter changed: ${paramId}`);
});
```

## Extends

- `EventEmitter`\<`AudioEvents`\>

## Properties

### connect()

> **connect**: () => `Promise`\<`void`\>

Defined in: [audio-output-stream.mts:210](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L210)

Connect the stream to PipeWire audio system.
Triggers format negotiation and initializes audio processing.

#### Returns

`Promise`\<`void`\>

***

### disconnect()

> **disconnect**: () => `Promise`\<`void`\>

Defined in: [audio-output-stream.mts:216](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L216)

Disconnect the stream from PipeWire.
Stops audio processing and releases resources.

#### Returns

`Promise`\<`void`\>

***

### write()

> **write**: (`samples`) => `Promise`\<`void`\>

Defined in: [audio-output-stream.mts:222](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L222)

Write audio samples to the stream.
Samples are JavaScript Numbers (-1.0 to 1.0) converted to negotiated format.

#### Parameters

##### samples

`Iterable`\<`number`\>

#### Returns

`Promise`\<`void`\>

***

### isFinished()

> **isFinished**: () => `Promise`\<`void`\>

Defined in: [audio-output-stream.mts:228](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L228)

Wait for all buffered audio to finish playing.
Useful for ensuring complete playback before cleanup.

#### Returns

`Promise`\<`void`\>

***

### dispose()

> **dispose**: () => `Promise`\<`void`\>

Defined in: [audio-output-stream.mts:234](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L234)

Dispose of the stream and release all resources.
Alternative to disconnect() for final cleanup.

#### Returns

`Promise`\<`void`\>

***

### \[asyncDispose\]()

> **\[asyncDispose\]**: () => `Promise`\<`void`\>

Defined in: [audio-output-stream.mts:273](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L273)

Automatic resource cleanup for `await using` syntax.
Equivalent to calling dispose().

#### Returns

`Promise`\<`void`\>

## Accessors

### format

#### Get Signature

> **get** **format**(): [`AudioFormat`](../classes/AudioFormat.md)

Defined in: [audio-output-stream.mts:240](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L240)

Get the negotiated audio format after connection.
Available only after successful connect().

##### Returns

[`AudioFormat`](../classes/AudioFormat.md)

***

### channels

#### Get Signature

> **get** **channels**(): `number`

Defined in: [audio-output-stream.mts:246](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L246)

Get the negotiated number of audio channels.
Available only after successful connect().

##### Returns

`number`

***

### rate

#### Get Signature

> **get** **rate**(): `number`

Defined in: [audio-output-stream.mts:252](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L252)

Get the negotiated sample rate in Hz.
Available only after successful connect().

##### Returns

`number`

***

### bufferSize

#### Get Signature

> **get** **bufferSize**(): `number`

Defined in: [audio-output-stream.mts:262](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L262)

Get the buffer size in bytes.
This represents the total internal buffer size as negotiated
and adjusted by quantum alignment. If you specified a specific
number of bytes for buffering, the actual buffer may be different
due to quantum boundary alignment requirements.
Available only after successful connect().

##### Returns

`number`

***

### isConnected

#### Get Signature

> **get** **isConnected**(): `boolean`

Defined in: [audio-output-stream.mts:267](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-output-stream.mts#L267)

Check if the stream is currently connected to PipeWire.

##### Returns

`boolean`
