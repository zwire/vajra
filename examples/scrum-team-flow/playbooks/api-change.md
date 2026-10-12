---
id: api-change
title: API change
phase: expand
lifecycle: tracer
kind: work
checks:
  - pnpm test:contract
  - pnpm openapi:diff --base origin/main --fail-on-breaking
exits:
  - to: increment
    when: another committed story is not done yet
  - to: sprint-review
    when: every committed story is done or returned to the backlog
---

# API change

## Purpose

Change the public REST API without breaking customers' ERP integrations: expand now, contract later.

## Steps

1. Classify the change with `pnpm openapi:diff --base origin/main`: additive or breaking.
2. For a breaking change, add the new field or endpoint next to the old one instead of replacing it.
3. Update `api/openapi.yaml` and the contract tests in `tests/contract/` for both shapes.
4. Mark the old shape deprecated in the spec with a sunset date 90 days out, and add it to `CHANGELOG.md`.
5. File the removal as a separate `INV` story dated after the sunset.
6. Open a pull request linking the story; merge with one approving review when CI is green.

## Done when

- `pnpm openapi:diff` reports no breaking change against `main`, `pnpm test:contract` is green for old and new shapes, and the removal story exists in `INV`.

## Reply with

- The API diff summary, sunset date, removal story, and PR link.
