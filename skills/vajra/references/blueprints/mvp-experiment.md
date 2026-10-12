---
id: mvp-experiment
title: MVP experiment
phase: explore
lifecycle: throwaway
kind: work
exits:
  - to: decide
    when: the verdict is validated or invalidated
  - to: frame-the-question
    when: the verdict is inconclusive
---

# MVP experiment

## Purpose

Test a value hypothesis with real users at minimum cost.

## Steps

1. Write the hypothesis: "⟨users⟩ will ⟨behavior⟩ because ⟨reason⟩; we'll know when ⟨metric⟩ reaches ⟨threshold⟩."
2. Choose the cheapest test that produces the metric (landing page, concierge, fake door, thin build).
3. Build and instrument it.
4. Run for the agreed window and collect the metric.

## Done when

- The metric is measured against the threshold, with a clear validated / invalidated / inconclusive verdict.
