The `run_in_terminal` tool sometimes fails to capture the command output. If that happens, use the `get_terminal_last_command` tool to retrieve the last command output from the terminal. If that fails, ask the user to copy-paste the output from the terminal.

# PipeWire Node.js Project Instructions

## 📋 Project Overview

- **Project:** Node.js PipeWire Client Library
- **Tech Stack:** C++ native addon + TypeScript API
- **Platform:** Linux with PipeWire
- **Purpose:** Performance-critical audio streaming - consider latency implications

## 🏃‍♂️ Running Examples & Testing

- **Use `npx tsx examples/*.mts`** to run examples directly from TypeScript source
- **Don't build for testing** - avoid `npm run build` unless specifically testing build output
- Examples are in TypeScript (`.mts`) and should be run with `tsx` for development

```bash
# ✅ Correct way to run examples
npx tsx examples/hello-pipewire.mts
npx tsx examples/quality-demo.mts
npx tsx examples/unified-api-demo.mts

# ❌ Don't do this for development testing
npm run build && node dist/examples/hello-pipewire.mjs
```

## 🎯 API Design Principles

- **Quality-based API** - Users choose `AudioQuality.High|Standard|Efficient` instead of technical formats
- **Always Float64 in JS** - Users work with JavaScript Numbers (-1.0 to +1.0), library handles conversion
- **Negotiated values** - Use `stream.format`, `stream.rate`, `stream.channels` (negotiated) not requested values
- **Clean interfaces** - Prefer getters over methods, remove runtime description functions in favor of JSDoc

## 🚀 Build & Development

- **Development**: `npm run build` compiles C++ and TypeScript
- **C++ changes**: Require `npm run build` to test
- **TypeScript changes**: Can test directly with `npx tsx`
- **Testing**: Use `npx tsx` for examples, `npm run build` for full validation

## 📚 Documentation Structure

When making changes, update relevant files:

- **`README.md`** - Project overview, API reference, usage examples
- **`DEVLOG.md`** - Current development status, progress tracking
- **`ARCHITECTURE.md`** - Technical decisions, design rationale
- **`CODING_STYLE.md`** - Coding preferences and standards

## 🤖 AI Assistant Workflow

**Before starting work:**

1. Check `git log --oneline -3` for recent changes
2. Review `DEVLOG.md` for current priorities and status
3. Follow patterns from existing codebase

**Key principles:**

- Use established patterns from existing code
- Test changes by running examples
- Update documentation when adding features
- Generate bash commands (project uses bash terminal)
