---
id: tracer-bullet
title: Tracer bullet
phase: expand
lifecycle: tracer
kind: work
exits:
  - to: increment
    when: the path runs end to end in the real pipeline with its test green
---

# Tracer bullet

## Purpose

Build the thinnest end-to-end path through the real architecture, meant to be kept and grown.

## Steps

1. Identify the layers the real system needs (input, logic, storage, output, deploy).
2. Implement one trivial behavior through every layer using production structure.
3. Wire it into the real build, test and CI pipeline (walking skeleton).
4. Add one test that exercises the full path.

## Done when

- The path runs end to end in the real pipeline, with the test green.
