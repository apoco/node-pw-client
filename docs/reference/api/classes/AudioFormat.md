[**pw-client**](../README.md)

***

# Class: AudioFormat

Defined in: audio-format.mts:103

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

Defined in: audio-format.mts:144

***

### Uint8

> `static` **Uint8**: `AudioFormat`

Defined in: audio-format.mts:150

***

### ULaw

> `static` **ULaw**: `AudioFormat`

Defined in: audio-format.mts:221

***

### ALaw

> `static` **ALaw**: `AudioFormat`

Defined in: audio-format.mts:222

***

### Uint8Planar

> `static` **Uint8Planar**: `AudioFormat`

Defined in: audio-format.mts:224

***

### Int16Planar

> `static` **Int16Planar**: `AudioFormat`

Defined in: audio-format.mts:230

***

### Int24\_32Planar

> `static` **Int24\_32Planar**: `AudioFormat`

Defined in: audio-format.mts:236

***

### Int32Planar

> `static` **Int32Planar**: `AudioFormat`

Defined in: audio-format.mts:242

***

### Float32Planar

> `static` **Float32Planar**: `AudioFormat`

Defined in: audio-format.mts:249

***

### Float64Planar

> `static` **Float64Planar**: `AudioFormat`

Defined in: audio-format.mts:255

***

### Int8Planar

> `static` **Int8Planar**: `AudioFormat`

Defined in: audio-format.mts:261

## Accessors

### enumValue

#### Get Signature

> **get** **enumValue**(): `number`

Defined in: audio-format.mts:122

##### Returns

`number`

***

### byteSize

#### Get Signature

> **get** **byteSize**(): `number`

Defined in: audio-format.mts:126

##### Returns

`number`

***

### BufferClass

#### Get Signature

> **get** **BufferClass**(): `OutputBufferFactory`

Defined in: audio-format.mts:130

##### Returns

`OutputBufferFactory`

***

### description

#### Get Signature

> **get** **description**(): `string`

Defined in: audio-format.mts:134

##### Returns

`string`

***

### Int16

#### Get Signature

> **get** `static` **Int16**(): `AudioFormat`

Defined in: audio-format.mts:157

##### Returns

`AudioFormat`

***

### Uint16

#### Get Signature

> **get** `static` **Uint16**(): `AudioFormat`

Defined in: audio-format.mts:161

##### Returns

`AudioFormat`

***

### Int24\_32

#### Get Signature

> **get** `static` **Int24\_32**(): `AudioFormat`

Defined in: audio-format.mts:165

##### Returns

`AudioFormat`

***

### Uint24\_32

#### Get Signature

> **get** `static` **Uint24\_32**(): `AudioFormat`

Defined in: audio-format.mts:171

##### Returns

`AudioFormat`

***

### Int32

#### Get Signature

> **get** `static` **Int32**(): `AudioFormat`

Defined in: audio-format.mts:177

##### Returns

`AudioFormat`

***

### Uint32

#### Get Signature

> **get** `static` **Uint32**(): `AudioFormat`

Defined in: audio-format.mts:181

##### Returns

`AudioFormat`

***

### Float32

#### Get Signature

> **get** `static` **Float32**(): `AudioFormat`

Defined in: audio-format.mts:209

##### Returns

`AudioFormat`

***

### Float64

#### Get Signature

> **get** `static` **Float64**(): `AudioFormat`

Defined in: audio-format.mts:215

##### Returns

`AudioFormat`

## Methods

### fromEnum()

> `static` **fromEnum**(`format`): `undefined` \| `AudioFormat`

Defined in: audio-format.mts:140

#### Parameters

##### format

`number`

#### Returns

`undefined` \| `AudioFormat`
