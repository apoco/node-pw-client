# Development Log

A chronological record of development progress, decisions, and current work status.

## 📅 July 13, 2025

### Development Workflow Notes 📝

- **Example Execution Preference**: Use `npx tsx examples/*.mts` instead of building TypeScript artifacts for examples. This avoids cluttering the workspace with `.mjs` build files and keeps the development process cleaner.
- **Testing Approach**: For development and testing, prefer direct TypeScript execution with `tsx` over the build-then-run approach unless specifically testing the build output.

- **Function Length Guidelines**: Look for opportunities to break down functions once they exceed ~40 lines. Prefer showing the general outline of what a function does without requiring scrolling. Extract helper functions to maintain readability and self-documenting code structure.

### Initial Project Setup ✅

- **Git Repository Initialized**

  - Created local git repo with `main` branch
  - Added comprehensive `.gitignore` for Node.js/C++ project
  - Initial commit (b009ca2) with complete codebase
  - Repository ready for feature branch development

- **Documentation Created**
  - Comprehensive README.md with project overview, API docs, examples
  - Claude context file (`.claude-context.md`) for AI assistant continuity
  - Development log (this file) for tracking progress

### Current Codebase Status ✅

- **Core Features Working:**

  - PipeWire session management
  - Audio output streams with multiple formats (Float32/64, Int16/32, UInt16/32)
  - TypeScript API with async/await and generator patterns
  - Resource management with Symbol.asyncDispose
  - Event system for stream state/property changes
  - Working examples: tone generation, white noise

- **Build System:**
  - node-gyp configuration for C++ native addon
  - TypeScript compilation to ESM modules
  - Build scripts: `npm run build`, `npm run build:native:debug`

### Next Development Priorities 🎯

**Immediate Goals:**

1. **Audio Input Streams** - Implement capture functionality
2. **Stream Node Targeting** - Connect streams to specific PipeWire nodes
3. **Enhanced Error Handling** - Better error reporting and recovery

**Future Goals:**

1. Performance optimization (zero-copy buffers)
2. Extended format support (24-bit, multi-channel)
3. Testing framework and CI/CD
4. Advanced examples (synthesizers, effects processors)

### Development Environment

- **OS:** Linux with PipeWire
- **Node.js:** 22+ (ESM required)
- **Editor:** VS Code with GitHub Copilot
- **AI Assistant:** Claude Sonnet 4
- **Terminal:** VS Code configured to use bash for consistency (personal shell choice doesn't affect project)

### Technical Decisions Made

- **Architecture:** Native C++ core with TypeScript wrapper
- **Module System:** ESM modules throughout
- **Resource Management:** Symbol.asyncDispose for automatic cleanup
- **Audio Processing:** Generator functions for sample streaming
- **Error Handling:** Exceptions in C++, Promise rejection in JS
- **Build System:** node-gyp + TypeScript compiler

### Audio Performance Optimization ✅

- **Issue**: Choppy/buzzing audio in stereo playback due to buffer underruns
- **Root Cause**: Sample-by-sample processing in `write()` method was too slow for real-time audio
- **Solution**: Optimized to batch processing - convert all samples to array first, then fill buffers efficiently
- **Performance Impact**: Eliminated audio glitches by ensuring consistent buffer fill rates
- **Technical Details**: Changed from `for...of` with individual `output.set()` calls to batch buffer operations

### Format Negotiation Race Condition Fix ✅

- **Issue**: Glitchy audio at the beginning of playback due to writing samples before format negotiation completed
- **Root Cause**: `connect()` returned immediately but format negotiation happened asynchronously via `onFormatChange` callback
- **Solution**: Modified `connect()` to wait for format negotiation to complete before resolving, ensuring correct format conversion from the first sample
- **Impact**: Clean audio playback from start, no more glitchy artifacts during format transition

## 2025-07-13: Simplified AudioQuality to Three Levels

Removed `AudioQuality.Compatible` level as it was redundant and confusing:

**Issue:** Compatible and Efficient had nearly identical format preferences (both prioritized Int16 first), making Compatible redundant. The name "Compatible" also incorrectly suggested other quality levels were incompatible, when PipeWire format negotiation ensures compatibility regardless of preference order.

**Solution:** Simplified to three clear quality levels:

- `AudioQuality.High` - Music production, mastering (Float64 → Float32 → Int32 → Int24_32 → Int16)
- `AudioQuality.Standard` - General apps, games (Float32 → Float64 → Int16 → Int32)
- `AudioQuality.Efficient` - Voice, system sounds (Int16 → Float32 → Float64 → Int32)

**Files Updated:**

- `lib/audio-quality.mts` - Removed Compatible enum value and implementations
- `README.md` - Updated quality level table and feature descriptions
- `docs/AUDIO_QUALITY_API.md` - Removed Compatible documentation and examples
- `docs/AUDIO_SAMPLES_REFERENCE.md` - Updated quality level example
- `examples/hello-pipewire.mts` - Updated comments
- Root documentation files (for backward compatibility)

**Result:** Cleaner API with three distinct quality levels that have clear performance characteristics and use cases. Format negotiation still ensures compatibility across all PipeWire systems.

## 2025-07-13: Removed formatNegotiated Event and "Quality Loss" Concept

Simplified format handling by removing the redundant `formatNegotiated` event and the misleading "quality loss" concept:

**Issues:**

1. `formatNegotiated` provided the same information as `formatChange` but with confusing "quality loss" messaging
2. "Quality loss" was misleading since we always work with Float64 in JavaScript and automatically convert to hardware formats
3. Format negotiation is an implementation detail that users shouldn't need to worry about

**Solution:**

- Removed `formatNegotiated` event entirely
- Kept `formatChange` event for users who need low-level format information
- Removed `hasQualityLoss` field from `getStreamInfo()`
- Simplified console messages to just show successful format negotiation
- Updated all examples and documentation

**Result:**

- Cleaner API with less confusing terminology
- Users focus on audio samples (-1.0 to +1.0) rather than format conversion details
- Format negotiation happens transparently in the background
- Simpler examples and documentation

**Files Updated:**

- `lib/audio-output-stream.mts` - Removed formatNegotiated event and quality loss logic
- All examples in `examples/` - Updated to use formatChange instead
- Documentation files - Removed formatNegotiated references

## 2025-07-13: Updated Comment Guidelines and Removed "Simplified API" Language

Implemented new comment guidelines focused on writing for future users rather than the current developer:

**New Comment Guidelines:**

- Write for future users of the unpublished software, not the current developer
- Avoid references to "old" vs "new" APIs - users only see the current API
- Don't use terms like "simplified" unless genuinely comparing alternatives
- Explain concepts and patterns that help users understand the library

**Changes Made:**

- **Coding Style Guidelines** - Added detailed comment audience section with examples
- **Removed "Simplified API" language** - Changed to "Quality-Based API" throughout codebase
- **Removed "New API" references** - Changed to "Modern API" or removed entirely
- **Removed migration sections** - Deleted "Migration from Old API" sections that don't make sense for first release
- **Updated examples** - Changed comments to explain concepts rather than reference development history

**Files Updated:**

- `docs/CODING_STYLE.md` - Added comment audience guidelines
- `README.md`, documentation files - Removed "simplified" language
- All examples - Updated comments to be user-focused
- `lib/` source files - Updated API descriptions

**Result:** Comments and documentation now focus on helping users understand the library rather than referencing development history they haven't seen.

### Simplified Media API Surface Area ✅

**What Changed:**

- Removed `media.type` and `media.category` options from `AudioOutputStreamOpts`
- These are now hardcoded as `"Audio"` and `"Playback"` (the only sensible values for audio output streams)
- Kept `role` as a direct option since it's useful for PipeWire routing and volume control policies

**Why:**

- For an audio output streaming library, `type` should always be `"Audio"` (not Video/Midi)
- For output streams, `category` should always be `"Playbook"` (not Capture/Duplex/etc.)
- The `role` property is actually useful - it tells PipeWire what type of audio this is for volume control and routing policies (Music vs Game vs Notification, etc.)

**Code Changes:**

- Updated `AudioOutputStreamOpts` interface to have flat `role?` property
- Simplified `#buildMediaProps` to always set correct type/category and optionally add role
- Updated all examples and documentation to use `role: "Music"` instead of `media: { role: "Music" }`

**Result:** Much cleaner API - no unnecessary configuration options while preserving the useful role functionality.

### Removed Redundant Format Parameters ✅

**What Changed:**

- Removed `format: AudioFormat` parameter from `#setupStreamConfiguration()`
- Removed `format: AudioFormat` from the config object passed to `#createNativeStream()`
- Both methods now hardcode `AudioFormat.Float64` since that's always what we use

**Why:**

- The JavaScript interface always uses `Float64` - we never pass anything else
- Format negotiation happens at the PipeWire level, not in our parameter passing
- Simplifies the internal API and removes unused flexibility

**Code Changes:**

- `#setupStreamConfiguration()` signature simplified from `(format, channels, preferredFormats, quality)` to `(channels, preferredFormats, quality)`
- `#createNativeStream()` config object no longer takes `format` parameter
- Both methods now directly reference `AudioFormat.Float64` where needed

**Result:** Cleaner internal API with no redundant parameters. JavaScript interface remains unchanged.

### Enhanced AudioFormat API with Built-in Descriptions ✅

**What Changed:**

- Added `description` field to `AudioFormat` constructor and instances
- Updated `formatChange` event to emit `AudioFormat` object instead of raw integer
- Removed `FormatCompatibility.getFormatDescription()` function - descriptions now built into format objects
- Simplified format handling throughout the codebase

**Why:**

- Users get meaningful format descriptions instead of opaque integer values (e.g., `283`)
- No more need for separate lookup functions to convert integers to descriptions
- Cleaner API - the format object itself contains all needed information
- Better developer experience with immediate access to human-readable format info

**API Changes:**

Before:

```typescript
stream.on("formatChange", (format) => {
  console.log(`Format: ${format.format}`); // Shows: "Format: 283"
});
```

After:

```typescript
stream.on("formatChange", (format) => {
  console.log(`Format: ${format.format.description}`);
  // Shows: "Format: 32-bit floating point (excellent quality)"
});
```

**Result:** Much more user-friendly format information with built-in descriptions and no need for external lookup functions.

---

## 📅 July 14, 2025

### Sample Rate Negotiation Implementation ✅

- **Enhanced Audio Quality API**: Extended the quality-based system to include sample rate negotiation alongside format negotiation
- **Quality-Based Rate Preferences**:

  - `AudioQuality.High`: Prefers ultra-high rates (192kHz → 96kHz → 88.2kHz → 48kHz → 44.1kHz)
  - `AudioQuality.Standard`: Balanced approach (48kHz → 44.1kHz → 96kHz → 88.2kHz → 32kHz)
  - `AudioQuality.Efficient`: Performance optimized (44.1kHz → 48kHz → 32kHz → 22.05kHz → 16kHz)

- **API Extensions**:

  - Added `preferredRates?: number[]` option to `AudioOutputStreamOpts`
  - Added `getRatePreferences(quality)` function for mapping quality to rates
  - Extended C++ `buildFormatParams()` to support rate choice negotiation via SPA_CHOICE_Enum
  - Updated native `connect()` method to accept both format and rate preferences

- **Benefits**:

  - Users can now specify quality levels that intelligently select both format AND sample rate
  - Manual override still available via `preferredRates` option
  - Automatic negotiation with audio device capabilities
  - Better performance on resource-constrained systems via quality-appropriate rate selection

- **Documentation**: Updated `AUDIO_QUALITY_API.md` with comprehensive rate negotiation guide and migration examples

### Current Implementation Status 🎯

- **Format Negotiation**: ✅ Complete - Quality levels map to format preferences
- **Rate Negotiation**: ✅ Complete - Quality levels now include rate preferences
- **Quality-Based API**: ✅ Complete - Single `quality` parameter controls both format and rate selection
- **Manual Override**: ✅ Complete - Both `preferredFormats` and `preferredRates` options available
- **Device Adaptation**: ✅ Complete - Automatic negotiation with PipeWire device capabilities

---

## 📝 Template for Future Entries

### [Date] - [Feature/Task Name]

**What was implemented:**

- Key changes made
- Files modified
- New functionality added

**Technical decisions:**

- Architecture choices
- Library/dependency decisions
- Performance considerations

**Testing:**

- How changes were verified
- Example code used
- Performance measurements

**Next steps:**

- Follow-up tasks
- Known issues to address
- Future enhancements

**Git commits:**

- Commit hashes and messages
- Branch information

---

**Current Status:** Core implementation complete, ready for feature expansion  
**Active Branch:** main  
**Last Commit:** b009ca2 - Initial commit
