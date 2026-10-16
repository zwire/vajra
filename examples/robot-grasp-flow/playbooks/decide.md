---
id: decide
title: Decide
phase: explore
lifecycle: any
kind: gate
promotes: throwaway->tracer
exits:
  - to: increment
    when: the verdict is go
  - to: spike
    when: the verdict is explore further
  - to: end
    when: the verdict is no-go
---

# Decide

## Purpose

Promotion gate from throwaway to tracer: decide what the spike taught and whether to build it.

## Steps

1. Summarize the notes: question, answer, measurements.
2. Check the answer is backed by measurements and justifies building.
3. [human-gate] Present go, explore further, or no-go with a recommendation, and wait for the verdict.
4. On go, write `${decisions}/<date>-<topic>.md`: context, decision, consequences, shortcuts not to carry over.
5. On go, define the first increment. Plan to rebuild it in the real package; do not move scratch code.

## Done when

- The verdict is recorded with its evidence; on go, `${decisions}/<date>-<topic>.md` and the first increment exist.

## Reply with

- The verdict, the decision record path, and the first increment.
