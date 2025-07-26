#!/usr/bin/env npx tsx

/**
 * Updates documentation by replacing code blocks with snippets from example files.
 *
 * Usage:
 *   npm run docs:update
 *   npx tsx scripts/update-docs.mts
 *
 * Looks for comments like:
 *   <!-- example-file.mts#snippet-id -->
 *
 * And replaces the following code block with the designated snippet.
 */

import { readFile, writeFile, readdir, stat } from "fs/promises";
import { join } from "path";

interface SnippetReference {
  file: string;
  snippetId: string;
  line: number;
}

interface ExampleSnippet {
  id: string;
  content: string;
  startLine: number;
  endLine: number;
}

function trimEmptyLines(content: string): string {
  const lines = content.split("\n");

  // Find first non-empty line
  let start = 0;
  while (start < lines.length && lines[start].trim() === "") {
    start++;
  }

  // Find last non-empty line
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === "") {
    end--;
  }

  // Return trimmed content
  if (start > end) {
    return ""; // All lines were empty
  }

  return lines.slice(start, end + 1).join("\n");
}

async function extractSnippetsFromExample(
  filePath: string
): Promise<Map<string, ExampleSnippet>> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const snippets = new Map<string, ExampleSnippet>();

  // Track all snippet regions
  const snippetRegions = new Map<string, { start: number; end: number }>();

  // Find all SNIPSTART/SNIPEND pairs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const startMatch = /^\s*\/\/ SNIPSTART\s+(\w+(?:-\w+)*)/.exec(line);
    const endMatch = /^\s*\/\/ SNIPEND\s+(\w+(?:-\w+)*)/.exec(line);

    if (startMatch) {
      const snippetId = startMatch[1];
      if (!snippetRegions.has(snippetId)) {
        snippetRegions.set(snippetId, { start: i + 1, end: -1 });
      }
    } else if (endMatch) {
      const snippetId = endMatch[1];
      const region = snippetRegions.get(snippetId);
      if (region && region.end === -1) {
        region.end = i - 1;
      }
    }
  }

  // Extract content for each snippet, filtering out snippet markers
  for (const [snippetId, region] of snippetRegions) {
    if (region.end === -1) {
      console.warn(
        `Warning: SNIPSTART found for '${snippetId}' but no matching SNIPEND`
      );
      continue;
    }

    const snippetLines: Array<string> = [];
    for (let i = region.start; i <= region.end; i++) {
      const line = lines[i];
      // Skip snippet marker lines
      if (
        !/^\s*\/\/ SNIPSTART\s+/.exec(line) &&
        !/^\s*\/\/ SNIPEND\s+/.exec(line)
      ) {
        snippetLines.push(line);
      }
    }

    snippets.set(snippetId, {
      id: snippetId,
      content: trimEmptyLines(snippetLines.join("\n")),
      startLine: region.start,
      endLine: region.end,
    });
  }

  return snippets;
}

function findSnippetReferences(content: string): Array<SnippetReference> {
  const lines = content.split("\n");
  const references: Array<SnippetReference> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = /^<!--\s*([^#]+)#(\w+(?:-\w+)*)\s*-->$/.exec(line);

    if (match) {
      const [, file, snippetId] = match;
      references.push({
        file: file.trim(),
        snippetId: snippetId.trim(),
        line: i,
      });
    }
  }

  return references;
}

async function updateDocumentationFile(filePath: string): Promise<boolean> {
  const content = await readFile(filePath, "utf-8");
  const originalContent = content;
  const lines = content.split("\n");

  const references = findSnippetReferences(content);

  if (references.length === 0) {
    return false; // No changes needed
  }

  console.log(`📄 ${filePath}: Found ${references.length} snippet references`);

  // Process references in reverse order to avoid line number shifts
  for (const ref of references.reverse()) {
    try {
      const examplePath = join("examples", ref.file);
      const snippets = await extractSnippetsFromExample(examplePath);
      const snippet = snippets.get(ref.snippetId);

      if (!snippet) {
        console.log(
          `   ⚠️  Snippet '${ref.snippetId}' not found in ${ref.file}`
        );
        continue;
      }

      // Find the code block that follows this reference
      let codeBlockStart = -1;
      let codeBlockEnd = -1;

      for (let i = ref.line + 1; i < lines.length; i++) {
        if (
          lines[i].startsWith("```typescript") ||
          lines[i].startsWith("```javascript")
        ) {
          codeBlockStart = i;
          break;
        }
        if (lines[i].trim() !== "" && !lines[i].startsWith("<!--")) {
          break; // Found non-empty, non-comment line before code block
        }
      }

      if (codeBlockStart === -1) {
        console.log(
          `   ⚠️  No code block found after reference at line ${ref.line + 1}`
        );
        continue;
      }

      // Find end of code block
      for (let i = codeBlockStart + 1; i < lines.length; i++) {
        if (lines[i] === "```") {
          codeBlockEnd = i;
          break;
        }
      }

      if (codeBlockEnd === -1) {
        console.log(
          `   ⚠️  Unterminated code block at line ${codeBlockStart + 1}`
        );
        continue;
      }

      // Replace the code block content
      const newLines = [
        ...lines.slice(0, codeBlockStart + 1),
        snippet.content,
        ...lines.slice(codeBlockEnd),
      ];

      lines.splice(0, lines.length, ...newLines);

      console.log(`   ✅ Updated snippet '${ref.snippetId}' from ${ref.file}`);
    } catch (error) {
      console.log(
        `   ❌ Error processing ${ref.file}#${ref.snippetId}:`,
        error
      );
    }
  }

  const newContent = lines.join("\n");

  if (newContent !== originalContent) {
    await writeFile(filePath, newContent, "utf-8");
    return true;
  }

  return false;
}

async function findMarkdownFiles(directory: string): Promise<Array<string>> {
  const files: Array<string> = [];

  try {
    const entries = await readdir(directory);

    for (const entry of entries) {
      const fullPath = join(directory, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not read directory ${directory}:`, error);
  }

  return files;
}

async function updateAllDocumentation(): Promise<void> {
  console.log("📚 Updating documentation with example snippets...\n");

  // Find all markdown files in docs directory and include README.md
  const docFiles = await findMarkdownFiles("docs");
  const docPaths = ["README.md", ...docFiles].sort();

  console.log(`📋 Found ${docPaths.length} documentation files:`);
  for (const path of docPaths) {
    console.log(`   - ${path}`);
  }
  console.log();

  let totalUpdated = 0;

  for (const docPath of docPaths) {
    try {
      const wasUpdated = await updateDocumentationFile(docPath);
      if (wasUpdated) {
        totalUpdated++;
      }
    } catch (error) {
      console.log(`❌ Error updating ${docPath}:`, error);
    }
  }

  console.log(`\n📊 Summary: ${totalUpdated} files updated`);

  console.log(
    totalUpdated > 0
      ? "\n✅ Documentation updated successfully!"
      : "\n📝 No documentation updates needed"
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllDocumentation().catch(console.error);
}
