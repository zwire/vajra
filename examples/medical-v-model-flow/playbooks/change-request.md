---
id: change-request
title: Change request
phase: any
lifecycle: any
kind: service
exits:
  - to: requirements
    when: the change is approved and the SRS must be updated
  - to: end
    when: the change is rejected and the reason is recorded
---

# Change request

## Purpose

Analyze a change to a baselined requirement before anything moves.

## Steps

1. Record the requested change and who asked for it.
2. List every affected SRS item, design element, test and risk control from `${trace-matrix}`.
3. Assess the risk impact per ISO 14971 and record it in `${risk-file}`.
4. [human-gate] Present the impact analysis and wait for the approver's decision.

## Done when

- The impact analysis and the decision are recorded.

## Reply with

- Affected items, risk impact, and the decision.
