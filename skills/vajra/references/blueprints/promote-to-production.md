---
id: promote-to-production
title: Promote to production
phase: extract
lifecycle: any
kind: gate
promotes: tracer->hardened
exits:
  - to: ship
    when: every checklist item has linked evidence and the approver agreed
  - to: harden
    when: any checklist item fails
---

# Promote to production

## Purpose

Promotion gate from `tracer` to `hardened`.

## Steps

1. Collect the evidence the checklist demands for ⟨failure_cost⟩: tests, review, readiness items.
2. Check each item; link evidence for each. Missing evidence fails the item.
3. ⟨[human-gate] approver: ⟨named approver or "the user"⟩⟩

## Done when

- Every checklist item has linked evidence and the gate verdict is recorded.
