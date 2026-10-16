---
id: release-gate
title: Release gate
phase: extract
lifecycle: any
kind: gate
promotes: tracer->hardened
checks:
  - ${migrate-dry-run}
  - ${e2e-staging}
irreversible: [${release}]
exits:
  - to: retro
    when: the release is live and verified
  - to: bug-fix
    when: QA said no-go because of a defect
---

# Release gate

## Purpose

QA-owned go / no-go for releasing `${default-branch}` to customers.

## Steps

1. Gather the release notes, the CI run for the release commit, exploratory QA findings and open defects by severity.
2. Check every migration in `${migrations}` since the last tag is reversible, or that `${restore-drill}` passed this week.
3. [human-gate] Present the evidence and wait for the QA lead's sign-off; record who signed off.
4. [irreversible] On go, run `${release}`.
5. Verify the release on production: `${health-check}`, `${error-dashboard}`, one smoke test per changed area.

## Done when

- `${release}` printed the new tag, `${health-check}` is green, and `${error-dashboard}` stays at baseline for `${release-watch}`; or the no-go is recorded with the blocking defects.

## Reply with

- The verdict, who signed off, the release tag, and verification evidence.
