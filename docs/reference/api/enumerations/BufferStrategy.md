[**pw-client**](../README.md)

***

# Enumeration: BufferStrategy

Defined in: [buffer-config.mts:11](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L11)

Buffer sizing strategy for audio streams.

## Enumeration Members

### MinimalLatency

> **MinimalLatency**: `"minimal-latency"`

Defined in: [buffer-config.mts:13](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L13)

Minimal latency (~5ms), smallest buffers (may cause underruns on slow systems)

***

### LowLatency

> **LowLatency**: `"low-latency"`

Defined in: [buffer-config.mts:15](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L15)

Low latency (~10ms), good for real-time applications

***

### Balanced

> **Balanced**: `"balanced"`

Defined in: [buffer-config.mts:17](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L17)

Balanced latency and reliability (~20ms, recommended default)

***

### Smooth

> **Smooth**: `"smooth"`

Defined in: [buffer-config.mts:19](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L19)

Smooth playback (~40ms), maximum reliability against dropouts

***

### MaxLatency

> **MaxLatency**: `"max-latency"`

Defined in: [buffer-config.mts:21](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L21)

User specifies target latency in milliseconds

***

### MaxSize

> **MaxSize**: `"max-size"`

Defined in: [buffer-config.mts:23](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L23)

User specifies exact buffer size in bytes

***

### QuantumMultiplier

> **QuantumMultiplier**: `"quanta"`

Defined in: [buffer-config.mts:25](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/buffer-config.mts#L25)

User specifies quantum multiplier (for PipeWire experts)
