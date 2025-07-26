#!/usr/bin/env tsx
/**
 * Comprehensive documentation generation script
 *
 * This script:
 * 1. Extracts snippets from .snippets/ into documentation files
 * 2. Copies .snippets/ to examples/ with SNIP markers removed
 * 3. Runs Prettier on the final examples for clean formatting
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  copyFileSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = join(fileURLToPath(import.meta.url), "..");
const rootDir = join(__dirname, "..");
const snippetsDir = join(rootDir, ".snippets");
const examplesDir = join(rootDir, "examples");
const docsDir = join(rootDir, "docs");

interface SnippetInfo {
  name: string;
  content: string;
  file: string;
}

interface UsageReport {
  totalSnippets: number;
  usedSnippets: Set<string>;
  orphanedSnippets: Array<SnippetInfo>;
  brokenReferences: Array<{ file: string; reference: string }>;
}

const snipBoundary = /^\s*\/\/\s*(?<type>SNIP(START|END)) (?<name>[\w-]+)\s*$/;

// Extract all snippets from .snippets directory
function extractSnippets(): Map<string, SnippetInfo> {
  const starts = new Map<string, number>();
  const snippets = new Map<string, SnippetInfo>();

  function processFile(filePath: string, relativePath: string) {
    if (
      !filePath.endsWith(".mts") &&
      !filePath.endsWith(".ts") &&
      !filePath.endsWith(".js")
    ) {
      return;
    }

    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = snipBoundary.exec(line);
      if (match?.groups) {
        const { type, name } = match.groups;
        if (type === "SNIPSTART") {
          starts.set(name, i + 1);
        } else if (match.groups.type === "SNIPEND") {
          const fileName = relativePath.replace(/^\.snippets\//, "");
          snippets.set(`${fileName}#${name}`, {
            name,
            content: lines
              .slice(starts.get(name) ?? 0, i)
              .filter((line) => !snipBoundary.test(line))
              .join("\n")
              .replace(/(^[\r\n]+)|([\r\n]+$)/gs, ""),
            file: relativePath,
          });
        }
      }
    }
  }

  function walkDirectory(dir: string, baseDir: string = dir) {
    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);
      const relativePath = join(dir, file).replace(baseDir + "/", "");

      if (statSync(fullPath).isDirectory()) {
        walkDirectory(fullPath, baseDir);
      } else {
        processFile(fullPath, relativePath);
      }
    }
  }

  walkDirectory(snippetsDir);
  return snippets;
}

const snippetPattern =
  /<!--\s*(?<filename>.*?)#(?<snippet>.*?)\s*-->\s*(?<code>```.*?```\n*)?/gs;

function updateDocumentationFiles(
  snippets: Map<string, SnippetInfo>
): UsageReport {
  const usedSnippets = new Set<string>();
  const brokenReferences: Array<{ file: string; reference: string }> = [];

  function processDocFile(filePath: string) {
    if (!filePath.endsWith(".md")) return;

    const content = readFileSync(filePath, "utf-8");
    const updatedContent = content.replaceAll(
      snippetPattern,
      (_match, filename, snippet) => {
        const snippetKey = `${filename}#${snippet}`;
        const matchingSnippet = snippets.get(snippetKey);
        if (matchingSnippet) {
          usedSnippets.add(snippetKey);
        } else {
          // Track broken references
          brokenReferences.push({
            file: filePath.replace(rootDir + "/", ""),
            reference: snippetKey,
          });
        }
        const code = matchingSnippet?.content ?? "";
        return `<!-- ${snippetKey} -->\n\n\`\`\`typescript\n${code}\n\`\`\`\n\n`;
      }
    );

    if (updatedContent !== content) {
      writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated snippets in ${filePath}`);
    }
  }

  function walkDocs(dir: string) {
    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);

      if (statSync(fullPath).isDirectory()) {
        walkDocs(fullPath);
      } else {
        processDocFile(fullPath);
      }
    }
  }

  walkDocs(docsDir);

  // Also check the main README.md file
  const mainReadme = join(rootDir, "README.md");
  processDocFile(mainReadme);

  // Generate usage report
  const orphanedSnippets: Array<SnippetInfo> = [];
  for (const [snippetKey, snippetInfo] of snippets) {
    if (!usedSnippets.has(snippetKey)) {
      orphanedSnippets.push(snippetInfo);
    }
  }

  return {
    totalSnippets: snippets.size,
    usedSnippets,
    orphanedSnippets,
    brokenReferences,
  };
}

// Remove SNIP markers from content
function removeSnipMarkers(content: string): string {
  return content
    .split("\n")
    .filter((line) => !snipBoundary.test(line))
    .join("\n");
}

// Clean up orphaned files in examples directory
function cleanupOrphanedExamples() {
  // Get list of source files in .snippets
  const sourceFiles = new Set<string>();

  function collectSourceFiles(dir: string) {
    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);

      if (statSync(fullPath).isDirectory()) {
        collectSourceFiles(fullPath);
      } else if (
        file.endsWith(".mts") ||
        file.endsWith(".ts") ||
        file.endsWith(".js")
      ) {
        sourceFiles.add(file);
      }
    }
  }

  collectSourceFiles(snippetsDir);

  // Clean up examples directory
  function cleanupExamples(dir: string) {
    if (!statSync(dir).isDirectory()) return;

    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);

      if (statSync(fullPath).isDirectory()) {
        cleanupExamples(fullPath);
      } else if (
        (file.endsWith(".mts") ||
          file.endsWith(".ts") ||
          file.endsWith(".js")) &&
        file !== "README.md"
      ) {
        // Check if this file has a corresponding source in .snippets
        if (!sourceFiles.has(file)) {
          try {
            unlinkSync(fullPath);
            console.log(`🗑️  Removed orphaned example: ${file}`);
          } catch (err) {
            console.warn(`⚠️  Could not remove orphaned file ${file}:`, err);
          }
        }
      }
    }
  }

  cleanupExamples(examplesDir);
}

// Copy .snippets to examples with SNIP markers removed
function generateCleanExamples() {
  function copyAndClean(srcDir: string, destDir: string) {
    // Ensure destination directory exists
    try {
      mkdirSync(destDir, { recursive: true });
    } catch (_err) {
      // Directory might already exist
    }

    const files = readdirSync(srcDir);

    for (const file of files) {
      const srcPath = join(srcDir, file);
      const destPath = join(destDir, file);

      if (statSync(srcPath).isDirectory()) {
        copyAndClean(srcPath, destPath);
      } else if (file !== "README.md") {
        // Skip the .snippets README
        if (
          file.endsWith(".mts") ||
          file.endsWith(".ts") ||
          file.endsWith(".js")
        ) {
          // Process code files to remove SNIP markers
          const content = readFileSync(srcPath, "utf-8");
          const cleanContent = removeSnipMarkers(content);
          writeFileSync(destPath, cleanContent);
          console.log(`✅ Generated clean example: ${file}`);
        } else {
          // Copy other files as-is
          copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  copyAndClean(snippetsDir, examplesDir);
}

// Run Prettier on examples directory
async function formatExamples() {
  try {
    console.log("🎨 Running Prettier on examples...");
    await execAsync("npx prettier --write examples/**/*.{mts,ts,js}", {
      cwd: rootDir,
    });
    console.log("✅ Examples formatted with Prettier");
  } catch (error) {
    console.warn("⚠️  Prettier formatting failed:", error);
    console.warn("   This is not critical - examples are still generated");
  }
}

// Main execution
async function main() {
  console.log("📚 Starting documentation generation...\n");

  try {
    // Step 1: Extract snippets
    console.log("1️⃣ Extracting snippets from .snippets/...");
    const snippets = extractSnippets();
    console.log(`   Found ${snippets.size} snippets\n`);

    // Step 2: Update documentation
    console.log("2️⃣ Updating documentation files...");
    const usageReport = updateDocumentationFiles(snippets);
    console.log("");

    // Step 3: Clean up orphaned examples
    console.log("3️⃣ Cleaning up orphaned examples...");
    cleanupOrphanedExamples();
    console.log("");

    // Step 4: Generate clean examples
    console.log("4️⃣ Generating clean examples...");
    generateCleanExamples();
    console.log("");

    // Step 5: Format examples
    console.log("5️⃣ Formatting examples...");
    await formatExamples();
    console.log("");

    console.log("🎉 Documentation generation completed successfully!");
    console.log("");
    console.log("📁 Generated files:");
    console.log("   • Updated snippets in docs/");
    console.log("   • Clean examples in examples/");
    console.log("   • All examples formatted with Prettier");
    console.log("");
    console.log("📊 Snippet Usage Report:");
    console.log(`   • Total snippets: ${usageReport.totalSnippets}`);
    console.log(`   • Used in docs: ${usageReport.usedSnippets.size}`);
    console.log(`   • Orphaned: ${usageReport.orphanedSnippets.length}`);

    let hasErrors = false;

    // Check for broken references first - this is a fatal error
    if (usageReport.brokenReferences.length > 0) {
      hasErrors = true;
      console.log("");
      console.log("❌ Broken snippet references found:");
      for (const broken of usageReport.brokenReferences) {
        console.log(`   • ${broken.file}: ${broken.reference}`);
      }
    }

    // Always show orphaned snippets - helpful for matching with broken references
    if (usageReport.orphanedSnippets.length > 0) {
      console.log("");
      console.log("⚠️  Orphaned snippets (not referenced in docs):");
      for (const snippet of usageReport.orphanedSnippets) {
        console.log(`   • ${snippet.file}#${snippet.name}`);
      }
      if (!hasErrors) {
        console.log("");
        console.log(
          "💡 Consider removing unused snippets or adding them to documentation."
        );
      }
    }

    // Exit with error if there were broken references
    if (hasErrors) {
      console.log("");
      console.error(
        "💥 Documentation generation failed due to broken snippet references!"
      );
      console.error("   Fix the broken references above and try again.");
      console.error(
        "   💡 Check if any orphaned snippets should be connected to broken references."
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Documentation generation failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
