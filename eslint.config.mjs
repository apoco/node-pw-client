import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { read } from "fs";

export default tseslint.config(
  // Base JavaScript rules
  js.configs.recommended,
  
  // TypeScript rules
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  
  // Prettier integration (turns off conflicting rules)
  prettier,
  
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    
    rules: {
      // Dead code detection
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-unused-expressions": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",
      
      // Code quality
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-useless-constructor": "error",
      
      // Consistent coding style
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-duplicate-imports": "error", // Combine imports from the same module
      "@typescript-eslint/explicit-function-return-type": "off", // TypeScript inference is usually good enough
      "@typescript-eslint/array-type": ["error", {
        default: "generic",
        readonly: "generic",
      }],
      
      // Performance
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/prefer-string-starts-ends-with": "error",
      
      // Safety
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/await-thenable": "off", // Turned off because it's petty
      "no-return-await": "off", // Turned off in favor of @typescript-eslint version
      "@typescript-eslint/return-await": ["error", "always"],
      
      // Allow async functions in event handlers - this is safe and convenient
      "@typescript-eslint/no-misused-promises": ["error", {
        "checksVoidReturn": {
          "arguments": false,
          "attributes": false
        }
      }],
      
      // Stylistic preferences matching our coding standards
      "@typescript-eslint/no-empty-function": ["error", { allow: ["constructors"] }],
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-readonly-parameter-types": "off", // Too strict for audio processing
      "@typescript-eslint/no-this-alias": "off",

      // Audio-specific rules - allow generator functions
      "@typescript-eslint/require-yield": "off", // Sometimes generators are used for structure
    },
  },
  
  {
    // Configuration for specific directories
    files: [".snippets/**/*.mts", "lib/**/*.mts", "scripts/**/*.mts"],
    rules: {
      // Snippets might have intentional examples that don't follow all rules
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
    },
  },
  
  {
    // Scripts might have different patterns
    files: ["scripts/**/*.mts"],
    rules: {
      // Scripts often use console for output
      "no-console": "off",
    },
  },
  
  {
    // Example files generated from snippets - less strict
    files: ["examples/**/*.mts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // Examples might have unused vars for demonstration
      "@typescript-eslint/no-floating-promises": "off", // Examples often have top-level promises
    },
  },
  
  {
    // Ignore certain files and directories
    ignores: [
      "build/**",
      "dist/**",
      "examples/**",
      "node_modules/**", 
      "*.js", // We're only linting TypeScript files
      "*.d.ts", // Type definition files
      "eslint.config.mjs", // Exclude the config file itself
    ],
  }
);
