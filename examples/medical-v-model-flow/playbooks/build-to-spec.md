---
id: build-to-spec
title: Build to spec
phase: expand
lifecycle: tracer
kind: work
checks:
  - ctest --test-dir build --output-on-failure
  - scripts/static-analysis.sh
exits:
  - to: build-to-spec
    when: another design element is not implemented yet
  - to: verify-against-spec
    when: every design element is implemented with its planned tests green
---

# Build to spec

## Purpose

Implement one design element exactly as designed, test-first.

## Steps

1. Pick the next design element in dependency order.
2. Write its planned unit tests and watch them fail.
3. Implement the element until the tests pass.
4. Run `ctest --test-dir build --output-on-failure` and `scripts/static-analysis.sh`.
5. Open a merge request; get two reviews.
6. Update `docs/trace.csv` with the test results.

## Done when

- `ctest` output shows the element's tests failing before and passing after, `scripts/static-analysis.sh` is clean, the merge request has two approvals, and `docs/trace.csv` has the results.

## Reply with

- The element, test evidence, merge request link.
