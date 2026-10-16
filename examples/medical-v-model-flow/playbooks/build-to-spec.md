---
id: build-to-spec
title: Build to spec
phase: expand
lifecycle: tracer
kind: work
checks:
  - ${unit-tests}
  - ${static-analysis}
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
4. Run `${unit-tests}` and `${static-analysis}`.
5. Open a merge request; get ${review-rule}.
6. Update `${trace-matrix}` with the test results.

## Done when

- `${unit-tests}` output shows the element's tests failing before and passing after, `${static-analysis}` is clean, the merge request has ${review-rule}, and `${trace-matrix}` has the results.

## Reply with

- The element, test evidence, merge request link.
