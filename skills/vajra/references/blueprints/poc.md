---
id: poc
title: PoC
phase: explore
lifecycle: throwaway
kind: work
exits:
  - to: decide
    when: every criterion is measured
  - to: demo-handoff
    when: the PoC itself is the deliverable
  - to: end
    when: the criteria are clearly not met
---

# PoC

## Purpose

Show that something is feasible against success criteria agreed in advance.

## Steps

1. Write measurable success criteria (throughput, accuracy, integration works end to end) and get them confirmed. ⟨autonomy: confirm with the user if not high⟩
2. Identify the riskiest assumption and attack it first.
3. Build the narrowest path that exercises the criteria.
4. Measure against every criterion and record raw results.

## Done when

- Each criterion is marked met or not met with measurements; known shortcuts are listed.
