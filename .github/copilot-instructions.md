# PipeWire Node.js Project Instructions

## 🚀 Quick Start Checklist

- [ ] Check `PROGRESS.md` for current work status
- [ ] Read [coding standards](../docs/explanation/coding-standards.md) for style requirements
- [ ] Use `.snippets/` for any code that goes in documentation
- [ ] Run `npm run docs:generate` after documentation changes
- [ ] Test examples with `npx tsx examples/<filename>`

## 🔧 Core Workflow

### New Feature Development

1. **Validate idea** - Present alternatives and ecosystem context
2. **Documentation first** - Update docs as if feature exists (validates UX)
3. **Example creation** - Write working examples in `.snippets/`
4. **Review cycle** - Let user validate approach before coding
5. **Implementation** - Code to match the documented API
6. **Testing** - Use examples to verify functionality

### Documentation Updates

- **Source files**: Always edit `.snippets/` never `examples/`
- **Generation**: Run `npm run docs:generate` after changes
- **API Documentation**: Add JSDoc comments to all public API, run `npm run docs:api`
- **Framework**: Use [Diátaxis](../docs/how-to-guides/author-documentation.md) (tutorial/how-to/reference/explanation)
- **Validation**: Ensure generated examples are runnable

### Code Quality Standards

- **TypeScript**: No `any`, loose types, or `@ts-ignore` - ask for help instead
- **Functions**: ~40 line limit, extract helpers for clarity
- **Resources**: Use RAII patterns, explicit cleanup
- **Performance**: Optimize audio-critical paths, minimize allocations
- **JSDoc**: REQUIRED for all public API elements, generates docs automatically

## 🛠️ Technical Patterns

### File Structure

```
.snippets/     # Source files with SNIP markers (edit these)
examples/      # Generated clean files (don't edit)
docs/          # Documentation with snippet placeholders
lib/           # TypeScript API layer
src/           # C++ implementation
```

### Import Style

```typescript
// ✅ Use package imports in examples
import { startSession } from "pw-client";

// ❌ Don't use relative imports in docs
import { startSession } from "../lib/index.mjs";
```

### Resource Management

```typescript
// ✅ Explicit cleanup (Node.js 22+)
const session = await startSession();
try {
  // use session
} finally {
  await session.dispose();
}

// ✅ Automatic cleanup (Node.js 24+)
await using session = await startSession();
```

## 🐛 Common Issues

### Terminal Commands

- `run_in_terminal` may not capture output → use `get_terminal_last_command`
- If that fails → ask user to copy-paste terminal output

### Build System

- Native build: `npm run build:native:debug && npx tsc`
- Doc generation: `npm run docs:generate`
- Example testing: `npx tsx examples/<file>`

### Project Tracking

- Update `PROGRESS.md` with work items and status
- Check items as completed, add new items as discovered
- User deletes file when feature/fix is committed

---

**📖 Comprehensive guides:** [Documentation authoring](../docs/how-to-guides/author-documentation.md) | [Architecture](../docs/explanation/architecture.md) | [Coding standards](../docs/explanation/coding-standards.md)
