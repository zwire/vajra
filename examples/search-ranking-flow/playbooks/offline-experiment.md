---
id: offline-experiment
title: Offline experiment
phase: explore
lifecycle: throwaway
kind: work
writes: [experiments/**]
exits:
  - to: decide
    when: NDCG@10 over three seeds is recorded against control
  - to: frame-hypothesis
    when: the result shows the hypothesis was wrong
  - to: end
    when: the gain is clearly below 0.003 and the user accepts stopping
---

# Offline experiment

## Purpose

Measure one hypothesis against control on the frozen judgment set. The output is a number and an explanation, not code to keep.

## Parameters

- Timebox: 2 sessions
- Variants: up to 3 independent variants in parallel, compared in one context

## Steps

1. Build the feature or model in `experiments/<name>/` against `data/snapshots/latest`, train split only.
2. Run `python -m rankeval offline --judgments eval/judgments-2026q3 --model experiments/<name> --seeds 1,2,3`.
3. Run the same command for control and record both in `experiments/<name>/RESULTS.md`.
4. Break the result down by query segment (head, torso, tail) and look at the five biggest losers.

## Done when

- `experiments/<name>/RESULTS.md` shows NDCG@10 mean and spread for variant and control over 3 seeds, the segment breakdown, and the biggest losers.

## Reply with

- Gain over control with spread, segments that win and lose, and the exit you are taking.
