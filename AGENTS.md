# Agent Guidelines & Skills Configuration

## Available Skills

Always check and prioritize using skills from:
1. **Workspace skills root**: `./skills/`
   - [`./skills/pre-commit-tests/SKILL.md`](file:///Users/pmarzoa/dev/finanzas/skills/pre-commit-tests/SKILL.md): **Mandatory pre-commit verification**. Requires running test suite with code coverage (`>= 80%`) before every commit.
   - [`./skills/versioning-and-changelog/SKILL.md`](file:///Users/pmarzoa/dev/finanzas/skills/versioning-and-changelog/SKILL.md): **Mandatory version bump & changelog maintenance**. Requires bumping version in `package.json` and updating `CHANGELOG.md` in English on every release.
   - [`./skills/caverman/skill.md`](file:///Users/pmarzoa/dev/finanzas/skills/caverman/skill.md): Communication mode.
2. **Global skills**: `~/.agents/skills/` (e.g., `angular-developer`, `angular-new-app`, `find-skills`)

### Skill Discovery & Usage Rules:
- Before executing tasks, review the available skills in `./skills/` and `~/.agents/skills/`.
- **Pre-Commit Rule**: Before making any git commit or finishing code features, run `npm run test:coverage` and verify that all tests pass with at least **80% code coverage**.
- **Versioning & Changelog Rule**: Bump `version` in `package.json` for new releases and keep `CHANGELOG.md` updated in English with a summary of changes per version.
- When a task or request aligns with a skill's description, read and follow the instructions within its `SKILL.md` or `skill.md` file.

