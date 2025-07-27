# Explanation

Deep-dive explanations of concepts, design decisions, and technical background.

## Architecture and Design

### 🏗️ [Architecture Overview](architecture.md)

Comprehensive view of the library's design and architectural decisions.

**Covers:**

- Native C++ core with TypeScript wrapper
- ES modules and modern JavaScript patterns
- Generator functions for audio streaming
- Resource management with Symbol.asyncDispose
- Multiple audio format support
- Promise-based async API

### 🎯 [Quality-Based API Design](quality-api-design.md)

Why we chose quality levels over technical audio formats.

**Explains:**

- Problems with traditional audio APIs
- Benefits of quality abstraction
- Quality level design rationale
- Developer experience improvements
- Automatic format negotiation

### 🎛️ [Buffer Configuration Concepts](buffer-configuration.md)

Understanding audio buffering, latency trade-offs, and buffer management design.

**Explains:**

- What audio buffering is and why it matters
- The fundamental trade-off between latency, reliability, and memory
- PipeWire's quantum system and its impact on buffer sizing
- Design philosophy behind buffer strategies

### 🔧 [Resource Management](resource-management.md)

Understanding resource management patterns for different Node.js versions.

**Covers:**

- Manual cleanup (Node.js 22 LTS compatible)
- Automatic cleanup (Node.js 24+ with explicit resource management)
- Best practices for resource cleanup
- Migration between patterns
- Performance considerations
- Debugging resource leaks

### 🔗 [PipeWire Integration](pipewire-integration.md)

How the library integrates with the PipeWire multimedia framework.

**Details:**

- PipeWire architecture and benefits
- Session and stream management
- Format negotiation process
- Real-time audio processing
- Security and sandboxing
- System integration features

## Technical Concepts

### 📈 [Performance Considerations](performance.md)

Understanding audio performance, latency, and optimization strategies.

**Topics:**

- Real-time audio constraints
- Latency sources and mitigation
- CPU usage optimization
- Memory management strategies
- Thread safety in audio applications

### 🔄 [Audio Format Conversion](audio-format-conversion.md)

How the library handles different audio formats transparently.

**Explains:**

- JavaScript Number to native format conversion
- Format priority algorithms
- Precision and quality trade-offs
- Hardware compatibility considerations
- Performance implications of conversion

### 🎵 [Generator-Based Audio Streaming](generator-audio-streaming.md)

The design philosophy behind using generator functions for audio.

**Rationale:**

- Memory efficiency benefits
- Functional programming patterns
- Composability and reusability
- Integration with JavaScript iterators
- Performance characteristics

## Design Philosophy

### 🎨 [Developer Experience Principles](developer-experience.md)

Core principles guiding the API design and developer interface.

**Principles:**

- Simplicity over complexity
- Modern JavaScript patterns
- Automatic resource management
- Clear error handling
- Progressive disclosure of complexity

### 🔒 [Security and Safety](security-safety.md)

How the library ensures safe and secure audio operations.

**Aspects:**

- PipeWire security model integration
- Resource leak prevention
- Sample value validation
- Error boundary design
- Safe defaults and validation

### 🌍 [Cross-Platform Considerations](cross-platform.md)

Design decisions for Linux audio ecosystem compatibility.

**Considerations:**

- PipeWire version compatibility
- Distribution differences
- Audio hardware variations
- Package management integration
- Future platform support plans

## Implementation Details

### 🧵 [Thread Safety and Concurrency](thread-safety.md)

How the library handles multi-threaded audio processing safely.

**Topics:**

- PipeWire callback thread model
- Lock-free audio data structures
- JavaScript main thread integration
- Error propagation across threads
- Memory synchronization strategies

### 🔧 [Node.js Addon Architecture](nodejs-addon.md)

Technical details of the native C++ addon implementation.

**Implementation:**

- Node-API (N-API) usage patterns
- Memory management between JS and C++
- Async operation handling
- Exception translation
- Build system integration

### 📦 [Resource Management](resource-management.md)

How automatic cleanup and resource management works.

**Mechanisms:**

- Symbol.asyncDispose implementation
- RAII patterns in C++
- Exception safety guarantees
- Resource leak detection
- Cleanup ordering and dependencies

## Historical Context

### 📜 [Linux Audio Evolution](linux-audio-evolution.md)

The evolution of Linux audio systems and PipeWire's role.

**Timeline:**

- OSS and early Linux audio
- ALSA standardization
- PulseAudio desktop integration
- JACK professional audio
- PipeWire unification

### 🎤 [Audio Programming Challenges](audio-programming-challenges.md)

Common challenges in audio programming and how this library addresses them.

**Challenges:**

- Real-time constraints
- Hardware diversity
- Format complexity
- Cross-platform compatibility
- Developer accessibility

## Future Direction

### 🚀 [Roadmap and Vision](roadmap-vision.md)

Future development plans and long-term vision.

**Areas:**

- Input stream support (recording)
- MIDI integration
- Advanced effects processing
- Performance optimizations
- Ecosystem integration

### 🔮 [Emerging Technologies](emerging-technologies.md)

How the library plans to evolve with new audio technologies.

**Technologies:**

- Spatial audio and 3D sound
- AI-powered audio processing
- Web audio integration
- Cloud audio services
- IoT and embedded audio

## Reading Guide

### For New Users

Start with:

1. [Architecture Overview](architecture.md) - Understand the big picture
2. [Quality-Based API Design](quality-api-design.md) - Learn the core concept
3. [Developer Experience Principles](developer-experience.md) - Understand the philosophy

### For Advanced Users

Focus on:

1. [Performance Considerations](performance.md) - Optimize your applications
2. [PipeWire Integration](pipewire-integration.md) - Understand system integration
3. [Thread Safety and Concurrency](thread-safety.md) - Advanced implementation details

### For Contributors

Study:

1. [Node.js Addon Architecture](nodejs-addon.md) - Implementation details
2. [Resource Management](resource-management.md) - Memory and cleanup patterns
3. [Security and Safety](security-safety.md) - Safety requirements

### For System Architects

Review:

1. [Cross-Platform Considerations](cross-platform.md) - Deployment planning
2. [Linux Audio Evolution](linux-audio-evolution.md) - Historical context
3. [Roadmap and Vision](roadmap-vision.md) - Future planning

## Explanation Standards

All explanations follow these principles:

- **Context First** - Start with the problem or motivation
- **Progressive Detail** - Begin high-level, then dive deeper
- **Real Examples** - Use concrete examples to illustrate concepts
- **Trade-off Analysis** - Explain design decisions and alternatives
- **Practical Impact** - Connect theory to practical development
