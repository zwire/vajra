---
id: design
title: Design
phase: any
lifecycle: any
kind: work
exits:
  - to: build-to-spec
    when: every REQ id maps to a design element and a planned test
---

# Design

## Purpose

Design the system and, in the same pass, the tests that will verify it (V-model pairing).

## Steps

1. Write the architecture and interfaces; reference REQ ids.
2. For each design element, write the paired test: acceptance tests for requirements, integration tests for interfaces, unit tests for units.
3. Record decisions as decision records.
4. ⟨review: independent design review⟩

## Done when

- Every REQ id maps to a design element and a planned test.
