import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next. "**/" prefixes so these
  // also match nested copies (e.g. a git worktree under .claude/worktrees/
  // has its own .next build output at a non-root depth that a bare ".next/**"
  // glob won't reach).
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    // Git worktrees are separate checkouts with their own source tree —
    // linting them from the main worktree just double-lints duplicate files.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
