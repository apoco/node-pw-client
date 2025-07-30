[**pw-client**](../README.md)

***

# Class: AudioFormat

Defined in: [audio-format.mts:103](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L103)

Audio format class representing different sample formats supported by PipeWire.
Handles conversion between JavaScript Numbers and various binary audio formats.

Users typically don't need to work with AudioFormat directly - it's handled
internally through quality presets and format negotiation.

 AudioFormat

## Example

```typescript
// Access negotiated format info
console.log(`Stream format: ${stream.format.description}`);
console.log(`Sample rate: ${stream.rate}Hz`);
console.log(`Channels: ${stream.channels}`);
```

## Properties

### Int8

> `static` **Int8**: `AudioFormat`

Defined in: [audio-format.mts:144](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L144)

***

### Uint8

> `static` **Uint8**: `AudioFormat`

Defined in: [audio-format.mts:150](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L150)

***

### ULaw

> `static` **ULaw**: `AudioFormat`

Defined in: [audio-format.mts:221](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L221)

***

### ALaw

> `static` **ALaw**: `AudioFormat`

Defined in: [audio-format.mts:222](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L222)

***

### Uint8Planar

> `static` **Uint8Planar**: `AudioFormat`

Defined in: [audio-format.mts:224](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L224)

***

### Int16Planar

> `static` **Int16Planar**: `AudioFormat`

Defined in: [audio-format.mts:230](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L230)

***

### Int24\_32Planar

> `static` **Int24\_32Planar**: `AudioFormat`

Defined in: [audio-format.mts:236](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L236)

***

### Int32Planar

> `static` **Int32Planar**: `AudioFormat`

Defined in: [audio-format.mts:242](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L242)

***

### Float32Planar

> `static` **Float32Planar**: `AudioFormat`

Defined in: [audio-format.mts:249](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L249)

***

### Float64Planar

> `static` **Float64Planar**: `AudioFormat`

Defined in: [audio-format.mts:255](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L255)

***

### Int8Planar

> `static` **Int8Planar**: `AudioFormat`

Defined in: [audio-format.mts:261](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L261)

## Accessors

### enumValue

#### Get Signature

> **get** **enumValue**(): `number`

Defined in: [audio-format.mts:122](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L122)

##### Returns

`number`

***

### byteSize

#### Get Signature

> **get** **byteSize**(): `number`

Defined in: [audio-format.mts:126](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L126)

##### Returns

`number`

***

### BufferClass

#### Get Signature

> **get** **BufferClass**(): `OutputBufferFactory`

Defined in: [audio-format.mts:130](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L130)

##### Returns

`OutputBufferFactory`

***

### description

#### Get Signature

> **get** **description**(): `string`

Defined in: [audio-format.mts:134](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L134)

##### Returns

`string`

***

### Int16

#### Get Signature

> **get** `static` **Int16**(): `AudioFormat`

Defined in: [audio-format.mts:157](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L157)

##### Returns

`AudioFormat`

***

### Uint16

#### Get Signature

> **get** `static` **Uint16**(): `AudioFormat`

Defined in: [audio-format.mts:161](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L161)

##### Returns

`AudioFormat`

***

### Int24\_32

#### Get Signature

> **get** `static` **Int24\_32**(): `AudioFormat`

Defined in: [audio-format.mts:165](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L165)

##### Returns

`AudioFormat`

***

### Uint24\_32

#### Get Signature

> **get** `static` **Uint24\_32**(): `AudioFormat`

Defined in: [audio-format.mts:171](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L171)

##### Returns

`AudioFormat`

***

### Int32

#### Get Signature

> **get** `static` **Int32**(): `AudioFormat`

Defined in: [audio-format.mts:177](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L177)

##### Returns

`AudioFormat`

***

### Uint32

#### Get Signature

> **get** `static` **Uint32**(): `AudioFormat`

Defined in: [audio-format.mts:181](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L181)

##### Returns

`AudioFormat`

***

### Float32

#### Get Signature

> **get** `static` **Float32**(): `AudioFormat`

Defined in: [audio-format.mts:209](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L209)

##### Returns

`AudioFormat`

***

### Float64

#### Get Signature

> **get** `static` **Float64**(): `AudioFormat`

Defined in: [audio-format.mts:215](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L215)

##### Returns

`AudioFormat`

## Methods

### fromEnum()

> `static` **fromEnum**(`format`): `undefined` \| `AudioFormat`

Defined in: [audio-format.mts:140](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/audio-format.mts#L140)

#### Parameters

##### format

`number`

#### Returns

`undefined` \| `AudioFormat`
