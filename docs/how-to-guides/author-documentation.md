# How to Author Documentation

This guide covers the process and guidelines for creating and maintaining documentation in this project, designed for both AI agents and human contributors.

## 📋 Documentation Framework

This project follows the [Diátaxis framework](https://diataxis.fr/) for documentation architecture:

- **[Tutorials](../tutorials/)** - Progressive, step-by-step learning experiences
- **[How-to Guides](../how-to-guides/)** - Task-oriented problem-solving guides
- **[Reference](../reference/)** - Technical specifications and API documentation
- **[Explanation](../explanation/)** - Conceptual understanding and design decisions

## 🏗️ Documentation Architecture

### Source vs. Generated Content

- **`.snippets/`** - Source files with `SNIPSTART`/`SNIPEND` markers for code extraction
- **`examples/`** - Generated clean files for users (auto-generated, don't edit directly)
- **`docs/`** - Documentation with snippet placeholders that get populated during build

### Code Snippet System

Code snippets are extracted from `.snippets/` files and injected into documentation. The beginning and end of a source code snippet is delineated with a `// SNIPSTART <id>` and `// SNIPEND <id>` pair of comments:

```typescript
// SNIPSTART example-a

const someCode = "foo";

// SNIPEND example-a
```

This snippet can now be injected into markdown document with an HTML comment containing the filename within the `.snippets` directory and the snippet ID, separated by a `#`:

````markdown
Here's how to create a stream:

<!-- getting-started.mts#stream-creation -->

```typescript
    // Create an audio output stream
    const stream = await session.createAudioOutputStream({
      name: "My First Audio App", // Friendly name for PipeWire
      quality: AudioQuality.Standard, // Good balance of quality/performance
      channels: 2, // Stereo output
    });

    try {
      // Connect to the audio system
      await stream.connect();
      console.log(
        `🔊 Stream connected: ${stream.format.description} @ ${stream.rate}Hz`
      );
```

````

The next time the documentation is generated, the snippet comment will insert or replace a code block containing the snippet's contents.

### How-to Guides

**Purpose**: Solve specific problems with practical instructions.

#### Structure Guidelines

1. **Problem statement** - What specific task this solves
2. **Quick solution** - Code example up front for experienced users
3. **Detailed explanation** - Step-by-step breakdown
4. **Variations** - Alternative approaches or parameters
5. **Troubleshooting** - Common issues and solutions

#### Writing Style

- Imperative mood ("Create a stream", "Set the quality")
- Problem-focused headings
- Scannable format with code blocks
- Assume user knows the basics

### Reference Documentation

**Purpose**: Provide complete technical specifications.

#### Structure Guidelines

1. **Brief description** - One-sentence summary
2. **Parameters/Properties** - Complete list with types
3. **Return values** - What the function/method returns
4. **Examples** - Minimal, focused code samples
5. **Related** - Links to tutorials and how-to guides

#### Writing Style

- Third person, factual tone
- Complete and precise language
- No tutorial-style explanations
- Focus on "what", not "how" or "why"

### Explanation Documentation

**Purpose**: Provide conceptual understanding and context.

#### Structure Guidelines

1. **Concept introduction** - What and why it exists
2. **Key principles** - Fundamental ideas and trade-offs
3. **Design decisions** - Why things work the way they do
4. **Examples** - Illustrative rather than tutorial
5. **Related concepts** - Connections to other ideas

#### Writing Style

- Conceptual and analytical
- Explain the reasoning behind decisions
- Compare alternatives and trade-offs
- Focus on understanding, not implementation

## � API Documentation

### Automated Generation from JSDoc

The API reference documentation at `docs/reference/api/` is **automatically generated** from TypeScript JSDoc comments in the `lib/` directory using TypeDoc.

**⚠️ CRITICAL RULES:**

- **NEVER manually edit files in `docs/reference/api/`** - They are regenerated automatically
- **JSDoc comments are REQUIRED for all public API elements** - Missing JSDoc breaks documentation
- **Update JSDoc when changing code** - Keep documentation synchronized with implementation

### JSDoc Standards

All exported functions, classes, interfaces, and types must have comprehensive JSDoc:

````typescript
/**
 * Creates a new audio output stream.
 *
 * @param opts - Stream configuration options (all optional)
 * @returns Promise resolving to AudioOutputStream instance
 * @throws Will reject if session is disposed or stream creation fails
 *
 * @example
 * ```typescript
 * const stream = await session.createAudioOutputStream({
 *   name: "My Audio App",
 *   quality: AudioQuality.Standard,
 *   channels: 2
 * });
 * ```
 */
export function createAudioOutputStream(
  opts?: AudioOutputStreamOpts
): Promise<AudioOutputStream>;
```

### Regenerating Documentation

**Generate all documentation:**
```bash
npm run docs:generate  # Runs both examples and API generation
```

**Generate specific documentation:**
```bash
npm run docs:examples  # Update examples from .snippets/
npm run docs:api      # Regenerate API docs from JSDoc
```

The `docs:api` command will:
1. Run TypeDoc to process JSDoc comments from `lib/`
2. Generate clean markdown files in `docs/reference/api/`
3. Create proper cross-references and navigation

### API Documentation Structure
````

### Regenerating API Documentation

After updating JSDoc comments, regenerate the API documentation:

```bash
npm run docs:api
```

This will:

1. Run TypeDoc to process JSDoc comments from `lib/`
2. Generate clean markdown files in `docs/reference/api/`
3. Create proper cross-references and navigation

### API Documentation Structure

The generated structure follows TypeDoc's organization:

```
docs/reference/api/
├── README.md              # API overview
├── functions/
│   └── startSession.md    # Function documentation
├── interfaces/
│   ├── PipeWireSession.md # Interface documentation
│   └── ...
├── classes/
│   └── AudioFormat.md     # Class documentation
└── enumerations/
    └── AudioQuality.md    # Enum documentation
```

## �🔄 Documentation Workflow

### For AI Agents

When updating documentation:

1. **Check current content** - Read existing files before editing
2. **Maintain framework compliance** - Ensure content fits the right category
3. **Update snippets in `.snippets/`** - Never edit `examples/` directly
4. **Update JSDoc comments in `lib/`** - For any API changes
5. **Run generation** - Use `npm run docs:generate` to update everything
6. **Regenerate API docs** - Use `npm run docs:api` after JSDoc changes
7. **Validate examples** - Ensure generated examples are runnable

### For Human Contributors

1. **Plan the content type** - Determine if it's tutorial, how-to, reference, or explanation
2. **Create/edit source files** - Work in `.snippets/` for code examples
3. **Write documentation** - Use snippet placeholders for code inclusion
4. **Update JSDoc comments** - For any public API changes in `lib/`
5. **Generate and test** - Run `npm run docs:generate` to update all documentation
6. **Review for quality** - Check for clarity, accuracy, and completeness

### Content Lifecycle

1. **Draft** - Initial content creation with placeholders
2. **Code integration** - Add working examples to `.snippets/`
3. **Generation** - Run docs generation to populate snippets
4. **Review** - Test examples and verify documentation accuracy
5. **Refinement** - Iterate based on feedback and testing

## 🧪 Testing and Validation

### Before Publishing

- **Run all examples** - Ensure generated code works
- **Check snippet integration** - Verify placeholders are populated
- **Validate links** - Ensure internal references work
- **Review for accuracy** - Match documentation to implementation

### Quality Checklist

- [ ] Examples are runnable with `npx tsx`
- [ ] Code uses package imports (`pw-client`)
- [ ] No broken internal links
- [ ] Proper error handling shown
- [ ] Technical accuracy verified
- [ ] Framework category is appropriate
- [ ] Clear learning progression (for tutorials)
- [ ] Problem-focused (for how-to guides)
- [ ] Complete specifications (for reference)
- [ ] Conceptual clarity (for explanations)
- [ ] All code snippets are exercised when examples run (no dead code)
- [ ] JSDoc comments updated for any API changes
- [ ] API documentation regenerated with `npm run docs:api`

## 🔍 Discovery and Navigation

### Cross-References

Always include relevant links:

- **From tutorials** → Related how-to guides and reference
- **From how-to guides** → Related tutorials and reference
- **From reference** → Relevant tutorials and explanations
- **From explanations** → Practical tutorials and how-to guides

### Index Pages

Each documentation section has an index page that:

- Introduces the section's purpose
- Lists all content in logical order
- Provides quick navigation
- Suggests learning paths

## 💡 Best Practices

### Content Organization

- **One concept per file** - Keep documentation focused
- **Logical file names** - Use descriptive, searchable names
- **Consistent structure** - Follow established patterns
- **Progressive complexity** - Order content from simple to advanced

### Code Quality in Documentation

- **Working examples** - All code should run without modification
- **Error handling** - Show proper cleanup and error management
- **Resource management** - Demonstrate both manual and automatic cleanup
- **Performance awareness** - Note when examples are for demonstration vs. production
- **No dead code** - Every code snippet must be exercised when the example runs; dead code may not actually work and undermines documentation quality. Never use underscore prefixes to hide dead code warnings - either use the code or remove it.

### Maintenance

- **Regular review** - Documentation should be reviewed with code changes
- **User feedback** - Incorporate feedback from real usage
- **Accuracy checks** - Verify examples still work with API changes
- **Link validation** - Ensure internal references remain valid

## 🚀 Getting Started

### For New Contributors

1. Read this guide completely
2. Explore existing documentation to understand patterns
3. Choose a documentation type based on your goal
4. Start with a simple example following established patterns
5. Use the generation workflow to test your changes

### For AI Agents

1. Always check existing content before making changes
2. Understand the Diátaxis framework and choose appropriate categories
3. Work in `.snippets/` for any code that needs to be documented
4. Use `npm run docs:generate` after making changes
5. Follow the coding standards and quality guidelines consistently

---

This documentation system enables high-quality, maintainable documentation that serves both learning and reference needs while automating the integration of working code examples.
