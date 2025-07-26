# Snippets Source Directory

This directory contains the source files used for building documentation and examples. These files include `SNIPSTART` and `SNIPEND` comments that are used by the documentation generation system to extract code snippets. If you are looking for examples, see the [examples directory](../examples) instead.

## 📁 Directory Structure

- `.snippets/` - Source files with snippet markers (this directory)
- `examples/` - Clean user-facing examples (generated automatically)
- `docs/` - Documentation that references snippets from this directory

## 🔄 Editing Workflow

1. **Edit snippet source**: Modify files in `.snippets/` to update code snippets used in documentation
1. **Test the source**: Use `npx tsx` to run the code. The snippets file should:
   - be runnable
   - should do what it is supposed to
   - should have no runtime errors unless demonstrating expected errors
   - should complete within the default 20 second timeout unless an exception is warranted
1. **Customize testing**: If the example doesn't complete within 20 seconds or exit normally, update [`test-examples.mts](../scripts/test-examples.mts) to customize how your script is tested.
1. **Generate documentation**: Run `npm run docs:build` to update documentation with latest snippets
1. **Generate clean examples**: The build process automatically creates clean versions in `examples/` without snippet markers
1. **Review results**: Check both the updated documentation and the clean examples

## 🛠️ Snippet Format

Files in this directory use `SNIPSTART` and `SNIPEND` comments to mark extractable code blocks:

```typescript
// SNIPSTART snippet-name
function example() {
  // This code will be extracted for documentation
}
// SNIPEND snippet-name
```

The documentation generation system extracts these marked sections and injects them into the appropriate documentation files.

Guidelines:

- Snippets can be nested or overlap; there's no requirement on open/closing boundaries other than that you should have a matching pair.
- It is OK to have one snippet include a wider selection of code and to have sub-snippets to highlight segments of the code.
- In documentation, use an encompassing snippet rather than series of discrete code blocks unless you have text between those code blocks; avoid code block lists that could instead be a continuous code block.
