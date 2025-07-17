# Architecture Decision Records (ADRs)

This file documents key architectural and design decisions made during development, including the rationale and trade-offs considered.

## ADR-001: Native C++ Core with TypeScript Wrapper

**Date:** July 13, 2025  
**Status:** Implemented

### Context

Need to provide JavaScript/TypeScript API for PipeWire audio applications while maintaining low-latency performance required for real-time audio.

### Decision

Implement a native C++ addon using Node-API with a TypeScript wrapper layer.

### Rationale

- **Performance:** C++ provides direct PipeWire integration with minimal overhead
- **Developer Experience:** TypeScript provides modern API with full type safety
- **Maintainability:** Clear separation between performance-critical and convenience layers
- **Compatibility:** Node-API ensures long-term compatibility across Node.js versions

### Alternatives Considered

1. **Pure JavaScript with FFI:** Too much overhead for real-time audio
2. **Pure C++ with basic JS bindings:** Poor developer experience
3. **WebAssembly:** Limited access to system APIs like PipeWire

### Trade-offs

- **Pros:** Optimal performance, excellent DX, strong typing
- **Cons:** More complex build process, platform-specific compilation

---

## ADR-002: ESM Modules Throughout

**Date:** July 13, 2025  
**Status:** Implemented

### Context

Need to choose module system for modern Node.js compatibility.

### Decision

Use ES modules (ESM) throughout the project, require Node.js 22+.

### Rationale

- **Future-proof:** ESM is the standard for modern JavaScript
- **Type Safety:** Better TypeScript integration with ESM
- **Tree Shaking:** Better bundling and optimization support
- **Modern Patterns:** Aligns with modern JavaScript development

### Alternatives Considered

1. **CommonJS:** Legacy, worse TypeScript integration
2. **Dual Package:** Added complexity for minimal benefit

### Trade-offs

- **Pros:** Modern, better tooling, future-proof
- **Cons:** Requires Node.js 22+, some legacy compatibility issues

---

## ADR-003: Generator Functions for Audio Streaming

**Date:** July 13, 2025  
**Status:** Implemented

### Context

Need an efficient, flexible API for streaming audio samples from JavaScript to the native layer.

### Decision

Use generator functions and iterables for audio sample streaming.

### Rationale

- **Memory Efficient:** Lazy evaluation, no need to buffer entire audio streams
- **Composable:** Easy to chain audio processing functions
- **Functional:** Encourages functional programming patterns
- **Intuitive:** Natural fit for sequential audio data

### Alternatives Considered

1. **Array Buffers:** Memory intensive for long audio streams
2. **Callback Streams:** More complex, callback-based API
3. **Node.js Streams:** Overhead and complexity for simple use cases

### Trade-offs

- **Pros:** Memory efficient, composable, elegant API
- **Cons:** Requires understanding of generator functions

---

## ADR-004: Symbol.asyncDispose for Resource Management

**Date:** July 13, 2025  
**Status:** Implemented

### Context

Need automatic cleanup of PipeWire resources (sessions, streams) to prevent leaks.

### Decision

Implement `Symbol.asyncDispose` on session and stream objects for automatic resource cleanup.

### Rationale

- **Safety:** Automatic cleanup prevents resource leaks
- **Modern:** Uses latest JavaScript standard for resource management
- **Ergonomic:** `await using` syntax is clean and clear
- **Deterministic:** Cleanup happens at well-defined points

### Alternatives Considered

1. **Manual cleanup:** Error-prone, easy to forget
2. **Finalizers:** Non-deterministic, not suitable for system resources
3. **Try/finally blocks:** Verbose, error-prone

### Trade-offs

- **Pros:** Automatic, safe, modern syntax
- **Cons:** Requires Node.js 22+, newer language feature

---

## ADR-005: Multiple Audio Format Support

**Date:** July 13, 2025  
**Status:** Implemented

### Context

PipeWire supports various audio formats, need to expose this flexibility to JavaScript.

### Decision

Support multiple audio formats (Float32/64, Int16/32, UInt16/32) with runtime format conversion.

### Rationale

- **Flexibility:** Different use cases need different formats
- **Performance:** Allow optimal format selection for specific scenarios
- **Compatibility:** Match PipeWire's native format support
- **Quality:** Support high-quality formats (Float64) and efficient formats (Int16)

### Alternatives Considered

1. **Single format (Float64):** Simpler but less flexible
2. **Format selection at compile time:** Less runtime flexibility

### Trade-offs

- **Pros:** Maximum flexibility, optimal performance per use case
- **Cons:** More complex implementation, format conversion overhead

---

## ADR-006: Promise-Based Async API

**Date:** July 13, 2025  
**Status:** Implemented

### Context

Many PipeWire operations are asynchronous, need consistent async pattern.

### Decision

Use Promise-based APIs throughout with async/await support, no callbacks.

### Rationale

- **Modern:** Async/await is the modern JavaScript standard
- **Composable:** Promises work well with other modern JavaScript features
- **Error Handling:** Unified error handling with try/catch
- **Readable:** More readable than callback-based code

### Alternatives Considered

1. **Callback-based:** Legacy pattern, callback hell potential
2. **Mixed callback/promise:** Inconsistent API

### Trade-offs

- **Pros:** Modern, readable, composable
- **Cons:** Slightly more complex implementation in C++

---

## Template for New ADRs

```markdown
## ADR-XXX: [Title]

**Date:** [Date]  
**Status:** [Proposed/Implemented/Deprecated]

### Context

[Description of the issue motivating this decision]

### Decision

[Description of the chosen solution]

### Rationale

[Explanation of why this solution was chosen]

### Alternatives Considered

[Other options that were evaluated]

### Trade-offs

[Pros and cons of the chosen solution]
```
