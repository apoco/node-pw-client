[**pw-client**](../README.md)

***

# Function: startSession()

> **startSession**(): `Promise`\<[`PipeWireSession`](../interfaces/PipeWireSession.md)\>

Defined in: session.mts:154

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
