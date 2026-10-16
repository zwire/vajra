---
id: api-change
title: API change
phase: expand
lifecycle: tracer
kind: work
checks:
  - ${contract-test}
  - ${api-diff}
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

1. Classify the change with `${api-diff}`: additive or breaking.
2. For a breaking change, add the new field or endpoint next to the old one instead of replacing it.
3. Update `${openapi-spec}` and the contract tests in `${contract-tests}` for both shapes.
4. Mark the old shape deprecated in the spec with a sunset date `${sunset-notice}` out, and add it to `${changelog}`.
5. File the removal as a separate `${tracker-project}` story dated after the sunset.
6. Open a pull request linking the story; merge with one approving review when CI is green.

## Done when

- `${api-diff}` reports no breaking change against `${default-branch}`, `${contract-test}` is green for old and new shapes, and the removal story exists in `${tracker-project}`.

## Reply with

- The API diff summary, sunset date, removal story, and PR link.
