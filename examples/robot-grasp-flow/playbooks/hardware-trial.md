---
id: hardware-trial
title: Hardware trial
phase: extract
lifecycle: any
kind: gate
promotes: tracer->hardened
irreversible:
  - ${heldout-eval}
  - ${real-launch}
exits:
  - to: ship
    when: the trial log and video show expected behavior with no abort
  - to: investigation
    when: the trial aborted or diverged from simulation
---

# Hardware trial

## Purpose

Promotion gate from tracer to hardened: run the change on the real arm under a safety checklist.

## Parameters

- Speed: 25% for the first run, then target speed
- Operator: a person at the e-stop, named in the trial log

## Steps

1. Write the trial plan: what moves, expected behavior, abort conditions.
2. Confirm the safety checklist: e-stop tested today, workspace clear, speed and force limits set, operator present.
3. [human-gate] Wait for the operator to confirm readiness on site and record their name.
4. [irreversible] Evaluate the detector once on the held-out split with `python3 ${heldout-eval}` and record precision and recall.
5. [irreversible] Run the trial at 25% speed with `ros2 launch ${bringup} ${real-launch} speed:=0.25`.
6. [irreversible] If the slow run matched the plan, repeat at target speed with `ros2 launch ${bringup} ${real-launch} speed:=1.0`.
7. Record the bag, logs and video in `${trials}/<date>/`; compare with `${sim-report}`.

## Done when

- `${trials}/<date>/` holds the bag, log, video and held-out metrics, showing expected behavior with no abort, or an analysis of the abort.

## Reply with

- The trial log, video link, comparison with simulation, and the verdict.
