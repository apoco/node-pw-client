# How-to Guides

Practical solutions for common audio programming tasks and challenges.

## Audio Quality and Performance

### 🎯 [Choose the Right Audio Quality](choose-audio-quality.md)

Select the optimal quality level for your application's requirements.

**When to use:**

- Deciding between High, Standard, and Efficient quality
- Optimizing for different use cases (music production, games, system sounds)
- Balancing quality vs. performance

### 🎛️ [Choose Buffer Configuration](choose-buffer-configuration.md)

Select the optimal buffer strategy for your latency, memory, and reliability requirements.

**When to use:**

- Balancing performance trade-offs between latency and reliability
- Configuring real-time audio applications with specific latency needs
- Managing memory usage in resource-constrained environments
- Troubleshooting audio dropouts or excessive latency

### ⚡ [Optimize for Low Latency](optimize-latency.md)

Minimize audio latency for real-time applications.

**When to use:**

- Building interactive music applications
- Creating real-time audio effects
- Developing live performance tools

### ✅ [Test Negotiated Audio Formats](test-negotiated-formats.md)

Verify that your audio streams negotiate the expected formats and quality levels.

**When to use:**

- Validating quality level behavior
- Debugging format negotiation issues
- Ensuring cross-platform compatibility

### 📈 [Monitor Performance](monitor-performance.md)

Track audio processing performance and identify bottlenecks.

**When to use:**

- Optimizing audio processing performance
- Comparing quality level efficiency
- Monitoring real-time performance metrics

## Audio Generation and Processing

### 🌊 [Generate Common Waveforms](generate-waveforms.md)

Create fundamental audio waveforms and synthesis techniques.

**When to use:**

- Building synthesizers or audio generators
- Creating sound effects
- Learning audio synthesis fundamentals

### � [Create Stereo Audio Effects](create-stereo-effects.md)

Implement panning, binaural beats, and spatial audio effects.

**When to use:**

- Creating immersive audio experiences
- Building music production tools
- Adding spatial effects to games or applications

### �🎛️ [Mix Multiple Audio Sources](mix-audio-sources.md)

Combine and control multiple audio streams effectively.

**When to use:**

- Building multi-track audio applications
- Creating audio mixers or DAWs
- Implementing dynamic audio layering

### 📊 [Handle Different Sample Rates](handle-sample-rates.md)

Work with various audio sample rates and conversions.

**When to use:**

- Supporting multiple audio hardware configurations
- Converting between different audio formats
- Optimizing for specific hardware capabilities

## Advanced Techniques

### 🎚️ [Create Audio Effects](create-audio-effects.md)

Implement common audio effects like reverb, delay, and filters.

**When to use:**

- Adding audio processing to your applications
- Building effect chains
- Creating custom audio processors

### 🎮 [Integrate with Game Engines](integrate-game-engines.md)

Use PipeWire audio in game development workflows.

**When to use:**

- Building audio systems for games
- Creating interactive audio experiences
- Integrating with existing game frameworks

### 📱 [Build Cross-Platform Audio Apps](cross-platform-audio.md)

Design audio applications that work across different environments.

**When to use:**

- Targeting multiple Linux distributions
- Creating portable audio applications
- Handling different PipeWire configurations

## Troubleshooting and Debugging

### 🔧 [Debug Audio Issues](debug-audio-issues.md)

Diagnose and fix common audio problems.

**When to use:**

- No audio output from your application
- Audio glitches or distortion
- Connection or format negotiation problems

### 🔍 [Monitor Audio Performance](monitor-performance.md)

Measure and optimize audio application performance.

**When to use:**

- Identifying performance bottlenecks
- Optimizing for resource-constrained systems
- Ensuring consistent audio quality

## Integration Patterns

### 🌐 [Connect to Audio Networks](connect-audio-networks.md)

Integrate with networked audio systems and protocols.

**When to use:**

- Building networked audio applications
- Connecting to remote audio sources
- Implementing audio streaming protocols

### 🎧 [Handle Device Changes](handle-device-changes.md)

Gracefully respond to audio hardware changes.

**When to use:**

- Supporting hot-pluggable audio devices
- Adapting to user device preferences
- Handling device failures and recovery

## Project and Development

### 📝 [Author Documentation](author-documentation.md)

Create and maintain high-quality documentation for the project.

**When to use:**

- Writing new tutorials, how-to guides, reference docs, or explanations
- Contributing to the project documentation
- Setting up automated documentation workflows
- Following documentation standards and best practices

## How-to Guide Structure

Each guide provides:

- **Problem statement** - What specific issue this solves
- **Quick solution** - Immediate answer for experienced developers
- **Detailed steps** - Step-by-step implementation
- **Code examples** - Working code you can copy and adapt
- **Variations** - Alternative approaches and customizations
- **Common pitfalls** - What to avoid and how to prevent issues

## Finding the Right Guide

**By Application Type:**

- **Music Production** → Audio Quality, Low Latency, Audio Effects
- **Games** → Multiple Sources, Device Changes, Performance Monitoring
- **System Integration** → Audio Quality (Efficient), Device Changes
- **Educational/Learning** → Common Waveforms, Audio Effects

**By Problem Type:**

- **Performance Issues** → Optimize Latency, Monitor Performance
- **Audio Quality** → Choose Audio Quality, Handle Sample Rates
- **Multiple Sources** → Mix Audio Sources, Audio Effects
- **Hardware Issues** → Debug Audio Issues, Handle Device Changes

## Need More Help?

- **Understanding concepts?** → Check [Explanation](../explanation/)
- **API details?** → See [Reference](../reference/)
- **Learning basics?** → Start with [Tutorials](../tutorials/)
- **Specific error?** → Try [Debug Audio Issues](debug-audio-issues.md)

### 📡 [Monitor Stream State and Events](monitor-stream-events.md)

Handle stream lifecycle events and monitor connection state for robust applications.

**When to use:**

- Building resilient audio applications
- Monitoring stream health and connection status
- Responding to format negotiation and errors
- Debugging connection issues
