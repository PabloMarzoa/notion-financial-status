---
name: pre-commit-tests
description: >
  Mandatory pre-commit verification skill. Executes the test suite with code coverage check
  requiring >= 80% coverage and 0 test failures before performing any git commit or push.
  Triggers on committing code, creating pull requests, or preparing releases.
---

# Pre-Commit Tests & Coverage Verification

Before performing any `git commit`, `git push`, or delivering code changes:

## 1. Mandatory Pre-Commit Execution Rule
Always execute the automated test suite with coverage enabled:
```bash
npm run test:coverage
```

## 2. Acceptance Criteria
1. **0 Test Failures**: 100% of unit tests must pass (`0 failed`).
2. **Code Coverage >= 80%**:
   - Total Statement and Line coverage across the codebase must meet or exceed **80%**.
   - If coverage drops below 80% or any test fails, write or update unit tests immediately before proceeding with the commit.

## 3. Coverage Verification Script
Run the CI validation command:
```bash
npm run test:ci
```
