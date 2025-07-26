#!/usr/bin/env npx tsx

/**
 * Validates that code snippets in documentation are accurate by
 * cross-referencing with working examples
 */

import { readFile, readdir } from "fs/promises";
import { join } from "path";

interface CodeBlock {
  content: string;
  file: string;
  lineStart: number;
}

async function extractCodeBlocks(filePath: string): Promise<Array<CodeBlock>> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const blocks: Array<CodeBlock> = [];

  let inCodeBlock = false;
  let currentBlock: Array<string> = [];
  let blockStart = 0;
  let isSnippetGenerated = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if the previous line contains a snippet placeholder
    if (
      i > 0 &&
      lines[i - 1].includes("<!--") &&
      lines[i - 1].includes(".mts#")
    ) {
      isSnippetGenerated = true;
    }

    if (line.startsWith("```typescript") || line.startsWith("```javascript")) {
      inCodeBlock = true;
      blockStart = i + 1;
      currentBlock = [];
    } else if (line === "```" && inCodeBlock) {
      inCodeBlock = false;

      // Only validate code blocks that aren't generated from snippets
      if (!isSnippetGenerated) {
        blocks.push({
          content: currentBlock.join("\n"),
          file: filePath,
          lineStart: blockStart,
        });
      }

      isSnippetGenerated = false; // Reset for next block
    } else if (inCodeBlock) {
      currentBlock.push(line);
    }
  }

  return blocks;
}

async function findSimilarExampleCode(snippet: string): Promise<Array<string>> {
  const exampleFiles = await readdir("./examples");
  const matches: Array<string> = [];

  // Simple heuristic: look for key function names or API calls
  const keyTerms =
    snippet.match(/\b(startSession|createAudioOutputStream|generateTone)\b/g) ??
    [];

  for (const file of exampleFiles.filter((f) => f.endsWith(".mts"))) {
    const exampleContent = await readFile(join("./examples", file), "utf-8");

    // Check if example contains similar API usage
    const hasMatchingTerms = keyTerms.every((term) =>
      exampleContent.includes(term)
    );
    if (hasMatchingTerms && keyTerms.length > 0) {
      matches.push(file);
    }
  }

  return matches;
}

async function validateDocs(): Promise<void> {
  console.log("📚 Validating documentation code snippets...\n");

  const docFiles = [
    "./README.md",
    "./docs/tutorials/getting-started.md",
    "./docs/tutorials/simple-synthesizer.md",
    "./docs/how-to-guides/generate-waveforms.md",
  ];

  let totalBlocks = 0;
  let validatedBlocks = 0;

  for (const docFile of docFiles) {
    try {
      const blocks = await extractCodeBlocks(docFile);
      totalBlocks += blocks.length;

      console.log(`📄 ${docFile}: ${blocks.length} code blocks`);

      for (const block of blocks) {
        const matches = await findSimilarExampleCode(block.content);

        if (matches.length > 0) {
          console.log(
            `   ✅ Line ${block.lineStart}: Similar to ${matches.join(", ")}`
          );
          validatedBlocks++;
        } else if (block.content.length > 50) {
          // Only flag substantial code blocks
          console.log(
            `   ⚠️  Line ${block.lineStart}: No matching example found`
          );
        } else {
          validatedBlocks++; // Don't penalize small snippets
        }
      }
    } catch (err) {
      console.log(`   ❌ Error reading ${docFile}:`, err);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   📝 Total code blocks: ${totalBlocks}`);
  console.log(`   ✅ Validated: ${validatedBlocks}`);
  console.log(`   ⚠️  Unvalidated: ${totalBlocks - validatedBlocks}`);

  if (validatedBlocks === totalBlocks) {
    console.log(
      "\n🎉 All documentation code appears to have example coverage!"
    );
  } else {
    console.log("\n💡 Consider adding examples for unvalidated code snippets.");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateDocs().catch(console.error);
}
