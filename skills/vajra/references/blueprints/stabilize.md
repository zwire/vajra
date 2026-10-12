---
id: stabilize
title: Stabilize
phase: any
lifecycle: any
kind: work
exits:
  - to: investigation
    when: the symptom stopped and the root cause is unknown
  - to: incident
    when: production users were affected
---

# Stabilize

## Purpose

Act first when the situation is chaotic (outage, broken main, data at risk), then understand.

## Steps

1. Contain: stop the bleeding with the smallest reversible action (rollback, feature flag off, revert).
2. ⟨[human-gate] before any irreversible containment⟩
3. Confirm the symptom stopped with an observation.
4. Capture what happened while it is fresh.

## Done when

- The symptom has stopped (observed) and a timeline exists.
