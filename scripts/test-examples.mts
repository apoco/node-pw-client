#!/usr/bin/env npx tsx

/**
 * Test runner for all snippet files to ensure they can run without errors.
 * Tests the source .snippets/ files directly rather than generated examples/
 * to ensure the source of truth is validated.
 */

import { spawn } from "child_process";
import { readdir } from "fs/promises";
import { join } from "path";

const SNIPPETS_DIR = "./.snippets";
const TIMEOUT_MS = 20_000; // 20 seconds max per example (increased for longer demos)

// Files to skip during testing (class modules, etc.)
const SKIP_FILES = [
  "simple-synth-class.mts", // Class module only - no demo to run
];

// Special handling for different types of examples
const EXAMPLE_CONFIGS = {
  "interactive-synthesizer.mts": {
    type: "interactive",
    stdin: [
      "play A 4 0.5 sine\n", // Play A4 note with sine wave
      "volume 0.3\n", // Set volume to 30%
      "play C 5 0.5 square\n", // Play C5 note with square wave
      "chord C E G 0.5\n", // Play C major chord
      "quit\n", // Exit
    ],
    timeout: 8000, // Increased timeout for multiple commands
  },
  "resource-management.mts": {
    type: "signal-handling",
    signalDelay: 3000, // Send SIGINT after 3 seconds
    timeout: 10000, // Allow up to 10 seconds total
  },
} as const;

interface TestResult {
  file: string;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

async function runExample(file: string): Promise<TestResult> {
  const startTime = Date.now();
  const config = EXAMPLE_CONFIGS[file as keyof typeof EXAMPLE_CONFIGS];
  const timeout = config?.timeout || TIMEOUT_MS;

  return await new Promise((resolve) => {
    const child = spawn("tsx", [join(SNIPPETS_DIR, file)], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    // eslint-disable-next-line prefer-const
    let timeoutHandle: NodeJS.Timeout;

    child.stdout?.on("data", (data: string | Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data: string | Buffer) => {
      stderr += data.toString();
    });

    const cleanup = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (!child.killed) {
        child.kill("SIGTERM");
      }
    };

    const finish = (code: number | null, signal?: string) => {
      cleanup();
      const duration = Date.now() - startTime;

      const normalExit = code === 0;

      if (normalExit) {
        resolve({
          file,
          success: true,
          output: stdout,
          duration,
        });
      } else {
        resolve({
          file,
          success: false,
          output: stdout,
          error: stderr || `Unexpected exit: code=${code}, signal=${signal}`,
          duration,
        });
      }
    };

    child.on("close", (code, signal) => {
      finish(code, signal ?? undefined);
    });

    child.on("error", (err) => {
      cleanup();
      const duration = Date.now() - startTime;
      resolve({
        file,
        success: false,
        output: stdout,
        error: err.message,
        duration,
      });
    });

    // Set up timeout
    timeoutHandle = setTimeout(() => {
      console.log(`\n⏰ ${file} timed out after ${timeout}ms`);
      child.kill("SIGTERM");
      const duration = Date.now() - startTime;
      resolve({
        file,
        success: false,
        output: stdout,
        error: `Timeout after ${timeout}ms`,
        duration,
      });
    }, timeout);

    // Handle special example types
    if (config) {
      if (config.type === "interactive") {
        // Send stdin commands with staggered timing
        config.stdin.forEach((input, index) => {
          setTimeout(
            () => {
              if (!child.killed && child.stdin?.writable) {
                child.stdin.write(input);
              }
            },
            (index + 1) * 1000
          ); // 1 second between each command
        });
      } else if (config.type === "signal-handling") {
        // Send SIGINT after delay to test signal handlers
        setTimeout(() => {
          if (!child.killed) {
            console.log(`\n📡 Sending SIGINT to ${file}...`);
            child.kill("SIGINT");
          }
        }, config.signalDelay);
      }
    }
  });
}

async function testAllExamples(): Promise<void> {
  console.log("🧪 Testing all snippets...\n");

  const files = await readdir(SNIPPETS_DIR);
  const exampleFiles = files.filter((f) => f.endsWith(".mts"));

  const results: Array<TestResult> = [];
  const skippedFiles: Array<string> = [];

  for (const file of exampleFiles) {
    if (SKIP_FILES.includes(file)) {
      console.log(`⏭️  Skipping ${file} (module only)`);
      skippedFiles.push(file);
      continue;
    }

    const config = EXAMPLE_CONFIGS[file as keyof typeof EXAMPLE_CONFIGS];
    const typeIndicator = config ? ` (${config.type})` : "";

    process.stdout.write(`Testing ${file}${typeIndicator}... `);
    const result = await runExample(file);

    if (result.success) {
      console.log(`✅ (${result.duration}ms)`);
    } else {
      console.log(`❌ (${result.duration}ms)`);
    }

    results.push(result);
  }

  // Summary
  console.log("\n📊 Results:");
  const passed = results.filter((r) => r.success).length;
  const failed = results.length - passed;

  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  if (skippedFiles.length > 0) {
    console.log(
      `   ⏭️  Skipped: ${skippedFiles.length} (${skippedFiles.join(", ")})`
    );
  }

  if (failed > 0) {
    console.log("\n🔍 Failures:");
    for (const result of results.filter((r) => !r.success)) {
      console.log(`\n   ${result.file}:`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
      if (result.output) {
        console.log(`     Output: ${result.output.slice(0, 200)}...`);
      }
    }
    process.exit(1);
  }

  console.log("\n🎉 All snippets passed!");
}

async function testSpecificExamples(filenames: Array<string>): Promise<void> {
  console.log(`🧪 Testing specific snippets: ${filenames.join(", ")}\n`);

  const results: Array<TestResult> = [];

  for (const file of filenames) {
    if (SKIP_FILES.includes(file)) {
      console.log(`⏭️  Skipping ${file} (module only)`);
      continue;
    }

    const config = EXAMPLE_CONFIGS[file as keyof typeof EXAMPLE_CONFIGS];
    const typeIndicator = config ? ` (${config.type})` : "";

    process.stdout.write(`Testing ${file}${typeIndicator}... `);
    const result = await runExample(file);

    if (result.success) {
      console.log(`✅ (${result.duration}ms)`);
    } else {
      console.log(`❌ (${result.duration}ms)`);
    }

    results.push(result);
  }

  // Summary
  console.log("\n📊 Results:");
  const passed = results.filter((r) => r.success).length;
  const failed = results.length - passed;

  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n🔍 Failures:");
    for (const result of results.filter((r) => !r.success)) {
      console.log(`\n   ${result.file}:`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
      if (result.output) {
        console.log(`     Output: ${result.output.slice(0, 500)}...`);
      }
    }
    process.exit(1);
  }

  // Also show successful test outputs for debugging
  console.log("\n🔍 Successful test outputs:");
  for (const result of results.filter((r) => r.success)) {
    console.log(`\n   ${result.file}:`);
    if (result.output) {
      console.log(`     Output: ${result.output.slice(0, 500)}...`);
    }
  }

  console.log("\n🎉 All specified snippets passed!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Test specific examples
    testSpecificExamples(args).catch(console.error);
  } else {
    // Test all examples
    testAllExamples().catch(console.error);
  }
}
