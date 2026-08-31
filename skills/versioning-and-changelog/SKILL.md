---
name: versioning-and-changelog
description: >
  Mandatory versioning and changelog maintenance skill. Requires bumping the version in package.json
  and updating CHANGELOG.md in English before releasing or publishing new versions.
---

# Versioning & Changelog Guidelines

When preparing a release, publishing a new version, or delivering significant feature updates:

## 1. Version Bump in `package.json`
- Increment `version` in `package.json` following [Semantic Versioning](https://semver.org/):
  - **Patch** (`0.0.x`): Bug fixes, minor UI tweaks, internal improvements.
  - **Minor** (`0.x.0`): New features, new components, non-breaking additions.
  - **Major** (`x.0.0`): Breaking changes or major architectural overhauls.

## 2. Update `CHANGELOG.md`
- Always record the new version in `CHANGELOG.md`.
- **Language**: English only.
- Follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:
  - `### Added`: New user-facing features, services, or assets.
  - `### Changed`: Changes in existing functionality or design updates.
  - `### Fixed`: Bug fixes and error handling corrections.
  - `### Removed`: Deprecated or removed capabilities.
