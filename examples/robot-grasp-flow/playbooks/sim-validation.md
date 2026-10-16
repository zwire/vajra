---
id: sim-validation
title: Sim validation
phase: expand
lifecycle: tracer
kind: work
checks:
  - ${sim-scenarios} --all --report ${sim-report}
exits:
  - to: increment
    when: a scenario fails its pass criteria
    on: fail
  - to: hardware-trial
    when: every scenario meets its pass criteria
    on: pass
---

# Sim validation

## Purpose

Prove the change in simulation across nominal, edge and failure scenarios before the real arm.

## Steps

1. List scenarios: nominal grasps, edge cases (clutter, transparent objects, near limits) and failures (camera dropout, object slip, unreachable target).
2. Run each scenario in Gazebo with `${sim-scenarios} --scenario <name>` and log success rate, clearance and cycle time.
3. Replay the latest real-arm bags through the stack and compare with what happened on the arm.
4. Check the arm reaches a safe state in every failure scenario.

## Done when

- `${sim-report}` shows grasp success ≥ ${min-success} over 50 trials and clearance ≥ ${min-clearance} in every nominal and edge scenario, and a safe state in every failure scenario.

## Reply with

- The scenario table with metrics, and any failures.
