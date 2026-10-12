---
id: decide
title: Decide
phase: explore
lifecycle: any
kind: gate
promotes: throwaway->tracer
exits:
  - to: tracer-bullet
    when: the verdict is go
  - to: frame-the-question
    when: the verdict is explore further
  - to: end
    when: the verdict is no-go
---

# Decide

## Purpose

Promotion gate from `throwaway` to `tracer`. Decide what happens to what exploration learned.

## Steps

1. Summarize the learning log: question, answer, evidence.
2. Check the promotion criteria for ⟨failure_cost⟩ (see gates-and-lifecycles.md).
3. Choose: build it (go), explore further (loop), or stop (no-go). ⟨[human-gate] when failure_cost is customer or regulated⟩
4. On go: write the decision record (context, decision, consequences) and the first slice to build.
5. On go with `artifact_lifetime: disposable`: plan a rebuild as a tracer bullet; do not move spike code.

## Done when

- A decision record exists with the verdict and its evidence.
