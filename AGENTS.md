# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains the product and technical definitions for IKIS, a personal and family finance application.

- `business definitions/` contains product vision, scope, domain rules, user stories, user flows, navigation, and screen planning.
- `technical definitions/` contains the proposed Angular/Firebase architecture, Firestore data model, security strategy, rules, and index review.
- `development_backlog.md` is the implementation sequence and acceptance-criteria checklist.
- `.agents/skills/` contains repository-local agent instructions.

The planned application is a single repository with an Angular PWA, Firebase Cloud Functions, Firestore configuration, and documentation. When implementation begins, follow the proposed `src/app/core/`, `src/app/shared/`, and `src/app/features/` layout.

## Build, Test, and Development Commands

No application build manifest or automated test runner is currently checked in. For documentation changes, use:

```bash
git diff --check
rg "US-[0-9]{3}|UF-[0-9]{3}" "business definitions"
git status --short
```

These commands detect whitespace errors, review story/flow references, and confirm the intended change set. Add project-specific build and test commands here when Angular and Firebase configuration land.

## Coding Style & Naming Conventions

Use Markdown headings in logical order, short paragraphs, and actionable bullet lists. Preserve established domain terms such as `familyId`, `createdByUserId`, and `recurringPayments`. User stories and flows use sequential IDs in their headings (`US-001`, `UF-001`) and numbered filenames such as `6. Register an Expense.md`.

For Firestore rules, use two-space indentation, camelCase helper names, and explicit validation for fields, roles, statuses, and family membership. Keep critical financial writes assigned to Cloud Functions as specified in the architecture.

## Testing Guidelines

There is no automated test suite yet. Review documentation changes for consistency across the related user story, user flow, business rules, data model, and backlog acceptance criteria. Any Firestore rule change should include emulator tests once the Firebase test setup is introduced, covering allowed and denied access.

## Commit & Pull Request Guidelines

Recent history mixes short summaries with Conventional Commit prefixes. Prefer clear imperative messages such as `docs: clarify transfer flow` or `feat: add account management`. Keep each commit focused.

Pull requests should explain the goal, list affected definitions, link relevant backlog IDs, and call out security or data-model changes. Include screenshots only for UI or wireframe changes, and report the validation commands run.


## Rules
No debes crear cosas(secciones, flujos, etc) que no esten ya definidas en las carpetas "business definitions" y "technical definitions"