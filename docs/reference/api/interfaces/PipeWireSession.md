[**pw-client**](../README.md)

***

# Interface: PipeWireSession

Defined in: [session.mts:67](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/session.mts#L67)

PipeWire session that manages the connection to the PipeWire audio server.

Sessions coordinate with PipeWire to create and manage audio streams.
They must be properly disposed to prevent resource leaks.

Use `startSession()` to create new instances rather than constructing directly.

## Example

```typescript
const session = await startSession();
const stream = await session.createAudioOutputStream({
  name: "My Audio App",
  quality: AudioQuality.Standard
});

// Always dispose when done
await session.dispose();
```

## Methods

### createAudioOutputStream()

> **createAudioOutputStream**(`opts?`): `Promise`\<[`AudioOutputStream`](AudioOutputStream.md)\>

Defined in: [session.mts:104](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/session.mts#L104)

Creates a new audio output stream.

#### Parameters

##### opts?

[`AudioOutputStreamOpts`](AudioOutputStreamOpts.md)

Stream configuration options (all optional)

#### Returns

`Promise`\<[`AudioOutputStream`](AudioOutputStream.md)\>

Promise resolving to AudioOutputStream instance

#### Throws

Will reject if session is disposed or stream creation fails

#### Example

```typescript
const stream = await session.createAudioOutputStream({
  name: "My Audio App",
  quality: AudioQuality.Standard,
  channels: 2
});
```

***

### dispose()

> **dispose**(): `Promise`\<`void`\>

Defined in: [session.mts:121](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/session.mts#L121)

Disposes the session and releases PipeWire resources.

After calling dispose(), the session cannot be used again.
All streams created by this session will be invalidated.

#### Returns

`Promise`\<`void`\>

Promise that resolves when cleanup is complete

***

### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

Defined in: [session.mts:131](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/session.mts#L131)

Automatic resource cleanup for `await using` syntax.

#### Returns

`Promise`\<`void`\>

#### See

dispose
