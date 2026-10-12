---
id: build-to-spec
title: Build to spec
phase: expand
lifecycle: tracer
kind: work
exits:
  - to: verify-against-spec
    when: every design element is implemented with its planned tests green
---

# Build to spec

## Purpose

Implement exactly the design, test-first against the planned tests.

## Steps

1. Pick the next design element in dependency order.
2. Implement its planned tests, then the code.
3. Run ⟨test command⟩; keep the traceability table updated (REQ → test → result).

## Done when

- All design elements are implemented with their planned tests green.
