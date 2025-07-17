# API Reference

Complete reference documentation for the PipeWire Node.js Client API.

## Modules

### Main Module

```typescript
import {
  startSession,
  AudioQuality,
  AudioFormat,
  type Session,
  type AudioOutputStream,
} from "pw-client";
```

## Functions

### `startSession()`

Creates a new PipeWire session.

```typescript
function startSession(): Promise<Session>;
```

**Returns:** `Promise<Session>` - A new PipeWire session

**Example:**

```typescript
await using session = await startSession();
```

**Throws:**

- `Error` - If PipeWire connection fails
- `Error` - If PipeWire is not available on the system

---

## Classes

### `Session`

Represents a connection to the PipeWire audio system. Implements `Symbol.asyncDispose` for automatic cleanup when using `await using`.

#### Methods

##### `createAudioOutputStream(options)`

Creates a new audio output stream.

```typescript
createAudioOutputStream(options: AudioOutputStreamOptions): Promise<AudioOutputStream>
```

**Parameters:**

- `options.name: string` - Human-readable stream name
- `options.quality: AudioQuality` - Audio quality level
- `options.channels: number` - Number of channels (1 = mono, 2 = stereo)
- `options.role?: string` - PipeWire role hint (optional)

**Returns:** `Promise<AudioOutputStream>` - A new audio output stream

**Example:**

```typescript
const stream = await session.createAudioOutputStream({
  name: "My Audio App",
  quality: AudioQuality.Standard,
  channels: 2,
  role: "Music",
});
```

**Throws:**

- `Error` - If stream creation fails
- `TypeError` - If invalid options provided

##### `dispose()`

Manually closes the session and cleans up resources. Use this for Node.js 22 LTS compatibility.

```typescript
dispose(): Promise<void>
```

**Example:**

```typescript
const session = await startSession();
try {
  // Use session...
} finally {
  await session.dispose(); // Manual cleanup
}
```

##### `[Symbol.asyncDispose]()`

Automatically closes the session and cleans up resources. Available in Node.js 24+.

```typescript
[Symbol.asyncDispose](): Promise<void>
```

**Example:**

```typescript
await using session = await startSession();
// Session automatically closed when scope exits
```

---

### `AudioOutputStream`

Represents an audio output stream. Implements `Symbol.asyncDispose` for automatic cleanup.

#### Properties

##### `name: string` (readonly)

The human-readable name of the stream.

##### `rate: number` (readonly)

The negotiated sample rate in Hz. Only available after `connect()`.

##### `channels: number` (readonly)

The number of audio channels (1 = mono, 2 = stereo).

##### `format: AudioFormat` (readonly)

The negotiated audio format. Only available after `connect()`.

##### `isConnected: boolean` (readonly)

Whether the stream is currently connected to PipeWire.

#### Methods

##### `connect()`

Connects the stream to the PipeWire audio system.

```typescript
connect(): Promise<void>
```

**Example:**

```typescript
await stream.connect();
console.log(`Connected: ${stream.format.description} @ ${stream.rate}Hz`);
```

**Throws:**

- `Error` - If connection fails
- `Error` - If stream is already connected

##### `write(samples)`

Writes audio samples to the stream.

```typescript
write(samples: Iterable<number>): Promise<void>
```

**Parameters:**

- `samples: Iterable<number>` - Audio samples as floating-point values (-1.0 to +1.0)

**Example:**

```typescript
function* generateTone(frequency: number, duration: number) {
  const totalSamples = duration * stream.rate * stream.channels;
  const cycle = (Math.PI * 2) / stream.rate;
  let phase = 0;

  for (let i = 0; i < totalSamples; i += stream.channels) {
    const sample = Math.sin(phase * frequency) * 0.3;
    for (let ch = 0; ch < stream.channels; ch++) {
      yield sample;
    }
    phase += cycle;
  }
}

await stream.write(generateTone(440, 2.0));
```

**Throws:**

- `Error` - If stream is not connected
- `RangeError` - If sample values are outside -1.0 to +1.0 range
- `TypeError` - If samples is not iterable

##### `dispose()`

Manually disconnects and cleans up the stream. Use this for Node.js 22 LTS compatibility.

```typescript
dispose(): Promise<void>
```

**Example:**

```typescript
const stream = await session.createAudioOutputStream(options);
try {
  // Use stream...
} finally {
  await stream.dispose(); // Manual cleanup
}
```

##### `[Symbol.asyncDispose]()`

Automatically disconnects and cleans up the stream. Available in Node.js 24+.

```typescript
[Symbol.asyncDispose](): Promise<void>
```

**Example:**

```typescript
await using stream = await session.createAudioOutputStream(options);
// Stream automatically cleaned up when scope exits
```

---

## Enums

### `AudioQuality`

Specifies the audio quality level for streams.

```typescript
enum AudioQuality {
  High = "High",
  Standard = "Standard",
  Efficient = "Efficient",
}
```

**Values:**

- `AudioQuality.High` - Maximum audio precision, highest CPU usage
- `AudioQuality.Standard` - Balanced quality and performance (default)
- `AudioQuality.Efficient` - Minimal CPU usage, basic quality

**Usage:**

```typescript
const stream = await session.createAudioOutputStream({
  quality: AudioQuality.High,
  // ...
});
```

---

## Types

### `AudioFormat`

Describes the negotiated audio format.

```typescript
interface AudioFormat {
  readonly name: string; // Format name (e.g., "Float32")
  readonly description: string; // Human-readable description
  readonly bitDepth: number; // Bits per sample
  readonly isFloat: boolean; // Whether format uses floating-point
  readonly isSigned: boolean; // Whether format is signed
}
```

**Example:**

```typescript
await stream.connect();
console.log(stream.format.description); // "Float32 Stereo"
console.log(stream.format.bitDepth); // 32
console.log(stream.format.isFloat); // true
```

### `AudioOutputStreamOptions`

Options for creating an audio output stream.

```typescript
interface AudioOutputStreamOptions {
  name: string; // Stream name
  quality: AudioQuality; // Audio quality level
  channels: number; // Number of channels
  role?: string; // PipeWire role hint (optional)
}
```

**Common role values:**

- `"Music"` - Music playback
- `"Game"` - Game audio
- `"Notification"` - System notifications
- `"Communication"` - Voice/VoIP
- `"Movie"` - Video playback

---

## Error Handling

### Common Errors

#### `PipeWireConnectionError`

Thrown when connection to PipeWire fails.

```typescript
try {
  await using session = await startSession();
} catch (error) {
  if (error.name === "PipeWireConnectionError") {
    console.error("PipeWire not available:", error.message);
  }
}
```

#### `StreamConnectionError`

Thrown when stream connection fails.

```typescript
try {
  await stream.connect();
} catch (error) {
  if (error.name === "StreamConnectionError") {
    console.error("Failed to connect stream:", error.message);
  }
}
```

#### `SampleRangeError`

Thrown when audio samples are outside valid range.

```typescript
try {
  await stream.write([2.0]); // Invalid: > 1.0
} catch (error) {
  if (error.name === "SampleRangeError") {
    console.error("Sample out of range:", error.message);
  }
}
```

### Error Recovery

```typescript
async function robustAudioPlayback(generator) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      await using session = await startSession();
      await using stream = await session.createAudioOutputStream({
        name: "Robust Audio",
        quality: AudioQuality.Standard,
        channels: 2,
      });

      await stream.connect();
      await stream.write(generator);
      return; // Success
    } catch (error) {
      attempts++;
      console.warn(`Attempt ${attempts} failed:`, error.message);

      if (attempts >= maxAttempts) {
        throw new Error(`Audio playback failed after ${maxAttempts} attempts`);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
```

---

## Best Practices

### Resource Management

Always use `await using` for automatic cleanup (Node 24):

```typescript
// ✅ Correct - automatic cleanup
await using session = await startSession();
await using stream = await session.createAudioOutputStream(options);

// ❌ Incorrect - manual cleanup required
const session = await startSession();
const stream = await session.createAudioOutputStream(options);
// Resources may leak if exception occurs
```

### Sample Generation

Use generator functions for memory-efficient audio:

```typescript
// ✅ Memory efficient
function* generateAudio() {
  for (let i = 0; i < 1000000; i++) {
    yield Math.sin(i * 0.1);
  }
}

// ❌ Memory intensive
function generateAudioArray() {
  const samples = [];
  for (let i = 0; i < 1000000; i++) {
    samples.push(Math.sin(i * 0.1));
  }
  return samples;
}
```

### Error Boundaries

Wrap audio operations in try-catch blocks:

```typescript
async function safeAudioOperation() {
  try {
    await using session = await startSession();
    await using stream = await session.createAudioOutputStream({
      name: "Safe Audio",
      quality: AudioQuality.Standard,
      channels: 2,
    });

    await stream.connect();
    await stream.write(generateAudio());
  } catch (error) {
    console.error("Audio operation failed:", error);
    // Handle gracefully - perhaps fall back to system beep
  }
}
```

### Performance Optimization

Check negotiated format for optimal performance:

```typescript
await stream.connect();

// Optimize based on actual format
if (stream.format.name === "Float32") {
  // Use Float32 optimized code path
} else if (stream.format.name === "Int16") {
  // Use Int16 optimized code path
}
```

---

## Complete Example

```typescript
import { startSession, AudioQuality } from "pw-client";

async function completeExample() {
  try {
    // Create session with automatic cleanup
    await using session = await startSession();
    console.log("✅ Connected to PipeWire");

    // Create stream
    await using stream = await session.createAudioOutputStream({
      name: "API Reference Example",
      quality: AudioQuality.Standard,
      channels: 2,
      role: "Music",
    });

    // Connect and check negotiated format
    await stream.connect();
    console.log(`🔊 Stream: ${stream.format.description} @ ${stream.rate}Hz`);

    // Generate and play audio
    function* generateSweep(
      startFreq: number,
      endFreq: number,
      duration: number
    ) {
      const samples = Math.floor(duration * stream.rate * stream.channels);
      const freqStep = (endFreq - startFreq) / (samples / stream.channels);
      let currentFreq = startFreq;
      let phase = 0;

      for (let i = 0; i < samples; i += stream.channels) {
        const sample = Math.sin(phase) * 0.2;

        // Output to all channels
        for (let ch = 0; ch < stream.channels; ch++) {
          yield sample;
        }

        phase += (Math.PI * 2 * currentFreq) / stream.rate;
        currentFreq += freqStep;
      }
    }

    // Play frequency sweep
    console.log("🎵 Playing frequency sweep...");
    await stream.write(generateSweep(220, 880, 3.0));

    console.log("✨ Example complete");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

completeExample();
```
