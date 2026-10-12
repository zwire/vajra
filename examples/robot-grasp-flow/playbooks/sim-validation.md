---
id: sim-validation
title: Sim validation
phase: expand
lifecycle: tracer
kind: work
checks:
  - ./tools/run_sim_scenarios.sh --all --report sim_report.json
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
2. Run each scenario in Gazebo with `./tools/run_sim_scenarios.sh --scenario <name>` and log success rate, clearance and cycle time.
3. Replay the latest real-arm bags through the stack and compare with what happened on the arm.
4. Check the arm reaches a safe state in every failure scenario.

## Done when

- `sim_report.json` shows grasp success ≥ 90% over 50 trials and clearance ≥ 2 cm in every nominal and edge scenario, and a safe state in every failure scenario.

## Reply with

- The scenario table with metrics, and any failures.
