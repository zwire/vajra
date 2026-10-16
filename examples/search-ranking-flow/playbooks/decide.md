---
id: decide
title: Decide
phase: explore
lifecycle: any
kind: gate
promotes: throwaway->tracer
exits:
  - to: implement-ranker
    when: the verdict is go
  - to: frame-hypothesis
    when: the verdict is explore further
  - to: end
    when: the verdict is no-go
---

# Decide

## Purpose

Promotion gate from throwaway to tracer: decide whether an offline win is worth building for real.

## Steps

1. Summarize `RESULTS.md`: gain, spread, segment breakdown, biggest losers.
2. Check the gain is at least `${min-gain}` and larger than the spread, and that no segment loses more than `${max-segment-loss}`.
3. Estimate the serving cost: new features to compute online and their latency.
4. [human-gate] Present go, explore further, or no-go with a recommendation, and wait for the verdict.
5. On go, write `${decisions}/<date>-<name>.md`: result, decision, serving cost, shortcuts in the experiment not to carry over.

## Done when

- The verdict is recorded; on go, `${decisions}/<date>-<name>.md` exists with the numbers it was based on.

## Reply with

- The verdict and the decision record path.
