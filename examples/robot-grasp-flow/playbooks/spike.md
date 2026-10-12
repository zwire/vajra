---
id: spike
title: Spike
phase: explore
lifecycle: throwaway
kind: work
writes: [scratch/**]
exits:
  - to: decide
    when: the spike notes state an answer with evidence
  - to: end
    when: the answer is a clear no-go and the user accepts it
---

# Spike

## Purpose

Answer one perception or planning question in simulation or on recorded bags. The output is knowledge, not code.

## Parameters

- Timebox: 1–2 sessions
- Scratch path: `scratch/<topic>/`
- Variants: independent approaches may run in parallel, compared in one context

## Steps

1. Write the question, the timebox and the result that would change the plan at the top of `scratch/<topic>/NOTES.md`.
2. Work only in `scratch/<topic>/`, against Gazebo or recorded bags. Never launch `real.launch.py`.
3. Build the least code that produces a measurement.
4. After each attempt, append to the notes: tried, observed (numbers, screenshots), concluded.
5. Stop at the answer or at the timebox, whichever comes first.

## Done when

- `scratch/<topic>/NOTES.md` states the answer, or "unknown after timebox", with measurements from Gazebo or named bags.

## Reply with

- The answer, the measurements, and the exit you are taking.
