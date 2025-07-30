[**pw-client**](../README.md)

***

# Function: startSession()

> **startSession**(): `Promise`\<[`PipeWireSession`](../interfaces/PipeWireSession.md)\>

Defined in: [session.mts:159](https://github.com/apoco/node-pw-client/blob/d59499190db38fc8e9b9fab4394158a6e7041400/lib/session.mts#L159)

Creates and starts a new PipeWire session.

This is the main entry point for the pw-client API. Sessions manage
connections to the PipeWire audio server and create audio streams.

## Returns

`Promise`\<[`PipeWireSession`](../interfaces/PipeWireSession.md)\>

Promise resolving to a started PipeWireSession

## Throws

Will reject if PipeWire connection fails or daemon unavailable

## Example

```typescript
// Manual resource management
const session = await startSession();
try {
  // Use session...
} finally {
  await session.dispose();
}

// Automatic cleanup (Node.js 22+)
await using session = await startSession();
```
