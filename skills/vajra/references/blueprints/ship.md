---
id: ship
title: Ship
phase: any
lifecycle: any
kind: work
exits:
  - to: end
    when: the change is merged and verified where it runs
  - to: bug-fix
    when: verification finds a defect
---

# Ship

## Purpose

Get a finished change merged and, if applicable, deployed.

## Steps

1. Open the change for review on ⟨VCS host⟩ with a clear description.
2. Drive CI to green; fix root causes, never skip tests.
3. [human-gate] Before deploying, confirm with the user when failure_cost is customer or regulated.
4. [irreversible] Merge and deploy with ⟨deploy command⟩.
5. Verify the change in the target environment.

## Done when

- The change is merged (and deployed when applicable) and verified where it runs.
