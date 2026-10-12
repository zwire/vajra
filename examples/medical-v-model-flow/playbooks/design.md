---
id: design
title: Design
phase: any
lifecycle: any
kind: work
exits:
  - to: build-to-spec
    when: every SRS id maps to a design element and a planned test
---

# Design

## Purpose

Design the software and, in the same pass, the tests that will verify it.

## Steps

1. Write the architecture and interfaces; reference SRS ids.
2. For each design element, write the paired test: system tests for SRS items, integration tests for interfaces, unit tests for units.
3. Record design decisions as decision records.
4. Get an independent design review in a fresh context; record findings and their resolution.
5. Update `docs/trace.csv`: SRS → design element → planned test.

## Done when

- `scripts/trace-check.py --require-design` shows every SRS id mapped to a design element and a planned test in `docs/trace.csv`, and review findings are resolved.

## Reply with

- Design elements, planned tests, review findings and their resolution.
