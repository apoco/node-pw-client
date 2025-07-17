# Reference

Technical specifications and API documentation for the PipeWire Node.js Client.

## API Documentation

### 📖 [Complete API Reference](api.md)

Full documentation of all classes, methods, and types.

**Includes:**

- Function signatures and parameters
- Class properties and methods
- TypeScript type definitions
- Error handling and exceptions
- Complete code examples

## Audio Specifications

### 🎵 [Audio Sample Formats](audio-samples.md)

Sample value ranges, formats, and conversion details.

**Covers:**

- Valid sample value ranges (-1.0 to +1.0)
- Common audio patterns and examples
- Stereo and multi-channel sample ordering
- Performance considerations

### 🎯 [Quality Level Specifications](quality-levels.md)

Technical details of each audio quality level.

**Details:**

- Format negotiation priorities
- Performance characteristics
- CPU and memory usage
- Typical negotiated formats by system

## Error Reference

### ❌ [Error Codes and Messages](error-codes.md)

Complete list of error conditions and troubleshooting.

**Includes:**

- Error types and categories
- Common error scenarios
- Recovery strategies
- Debug information

## Configuration Reference

### ⚙️ [Stream Configuration Options](stream-config.md)

All available options for creating audio streams.

**Parameters:**

- Required vs. optional parameters
- Valid value ranges
- Default behaviors
- Platform-specific considerations

### 🔧 [Session Configuration](session-config.md)

Options for PipeWire session management.

**Settings:**

- Connection parameters
- Security and permissions
- Resource limits
- Error handling modes

## Format Specifications

### 📊 [Audio Format Details](audio-formats.md)

Technical specifications for supported audio formats.

**Formats:**

- Int16, Int32, Float32, Float64
- Bit depths and dynamic ranges
- Endianness and encoding
- Conversion algorithms

### 📈 [Sample Rate Handling](sample-rates.md)

Support for different audio sample rates.

**Rates:**

- Common sample rates (44.1kHz, 48kHz, 96kHz)
- Resampling behavior
- Quality implications
- Hardware compatibility

## Constants and Enums

### 📋 [AudioQuality Enum](audioquality-enum.md)

Complete specification of quality levels.

**Values:**

- `AudioQuality.High`
- `AudioQuality.Standard`
- `AudioQuality.Efficient`

### 🏷️ [Role Constants](role-constants.md)

PipeWire role hints for stream categorization.

**Roles:**

- Music, Game, Notification
- Communication, Movie
- Custom role definitions

## Platform Reference

### 🐧 [Linux Compatibility](linux-compatibility.md)

Supported Linux distributions and PipeWire versions.

**Coverage:**

- Minimum PipeWire version requirements
- Distribution-specific considerations
- Package installation instructions
- Known compatibility issues

### 🔧 [Build Requirements](build-requirements.md)

System requirements for building from source.

**Requirements:**

- Compiler versions and flags
- Library dependencies
- Development headers
- Build tool versions

## Performance Reference

### ⚡ [Performance Characteristics](performance-characteristics.md)

Benchmarks and performance data.

**Metrics:**

- CPU usage by quality level
- Memory consumption patterns
- Latency measurements
- Throughput capabilities

### 📊 [Memory Usage](memory-usage.md)

Memory allocation patterns and optimization.

**Details:**

- Buffer size calculations
- Memory pooling strategies
- Garbage collection considerations
- Memory leak prevention

## Reference Organization

### Quick Lookup

- **API method?** → [API Reference](api.md)
- **Sample values?** → [Audio Sample Formats](audio-samples.md)
- **Error message?** → [Error Codes](error-codes.md)
- **Quality setting?** → [Quality Level Specifications](quality-levels.md)

### Detailed Specifications

- **Audio formats** → [Audio Format Details](audio-formats.md)
- **Performance data** → [Performance Characteristics](performance-characteristics.md)
- **Build information** → [Build Requirements](build-requirements.md)
- **Platform support** → [Linux Compatibility](linux-compatibility.md)

## Using the Reference

### For Developers

- Use as quick lookup during development
- Reference for understanding parameter ranges
- Troubleshooting with error codes
- Performance optimization guidance

### For System Integrators

- Platform compatibility verification
- Build and deployment requirements
- Performance planning and capacity
- Security and permission models

### For Contributors

- API design consistency
- Testing parameter validation
- Documentation standards
- Code review guidelines

## Reference Standards

All reference documentation follows these standards:

- **Accuracy** - Verified against implementation
- **Completeness** - All parameters and options documented
- **Consistency** - Uniform formatting and terminology
- **Examples** - Concrete usage examples where helpful
- **Updates** - Maintained with each release
