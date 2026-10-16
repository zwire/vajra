---
id: requirements
title: Requirements
phase: any
lifecycle: any
kind: work
irreversible: ["${baseline} SRS"]
exits:
  - to: design
    when: the requirements baseline is signed off
---

# Requirements

## Purpose

Capture the release's software requirements as verifiable, identified SRS items.

## Steps

1. Elicit functional, performance, safety and usability requirements; give each an id (`SRS-n`).
2. Write each as verifiable: condition, behavior, measure.
3. Link each safety requirement to its hazard in the risk file `${risk-file}`.
4. Record open questions and resolve them with the user.
5. [human-gate] Present the SRS and wait for the named approver.
6. [irreversible] Baseline the SRS with `${baseline} SRS`.

## Done when

- A baselined SRS exists with every item verifiable and linked in `${trace-matrix}`.

## Reply with

- The SRS ids, the baseline reference, and the approver.
