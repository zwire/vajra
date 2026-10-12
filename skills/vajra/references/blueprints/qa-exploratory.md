---
id: qa-exploratory
title: Exploratory QA
phase: any
lifecycle: any
kind: service
exits:
  - to: bug-fix
    when: a charter found a defect
  - to: regression-suite
    when: findings should become regression tests
  - to: end
    when: all charters ran and no defect is open
---

# Exploratory QA

## Purpose

Find defects that scripted tests miss, using time-boxed charters.

## Steps

1. Write charters: "Explore ⟨area⟩ with ⟨resources⟩ to discover ⟨risk⟩", prioritized by impact × likelihood.
2. ⟨parallelism: run charters in parallel when allowed⟩
3. For each charter, test within the timebox; log observations and defects with reproduction steps.
4. For each defect found, create a regression test or a bug-fix entry.

## Done when

- All charters are run, with findings logged and defects filed.
