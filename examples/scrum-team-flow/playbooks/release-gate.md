---
id: release-gate
title: Release gate
phase: extract
lifecycle: any
kind: gate
promotes: tracer->hardened
checks:
  - pnpm db:migrate --dry-run --env staging
  - pnpm test:e2e --env staging
irreversible: [pnpm release]
exits:
  - to: retro
    when: the release is live and verified
  - to: bug-fix
    when: QA said no-go because of a defect
---

# Release gate

## Purpose

QA-owned go / no-go for releasing `main` to customers.

## Steps

1. Gather the release notes, the CI run for the release commit, exploratory QA findings and open defects by severity.
2. Check every migration in `db/migrations/` since the last tag is reversible, or that `pnpm db:restore-drill` passed this week.
3. [human-gate] Present the evidence and wait for the QA lead's sign-off; record who signed off.
4. [irreversible] On go, run `pnpm release`.
5. Verify the release on production: health checks, error rate, one smoke test per changed area.

## Done when

- `pnpm release` printed the new tag, `/healthz` is green, and the Grafana "api-errors" panel stays at baseline for 30 minutes; or the no-go is recorded with the blocking defects.

## Reply with

- The verdict, who signed off, the release tag, and verification evidence.
