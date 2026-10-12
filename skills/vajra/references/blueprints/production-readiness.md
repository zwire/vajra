---
id: production-readiness
title: Production readiness
phase: extract
lifecycle: tracer
kind: work
exits:
  - to: promote-to-production
    when: every item has a linked artifact or an owned gap
---

# Production readiness

## Purpose

Collect evidence that the system can run in production (production readiness review).

## Steps

1. SLOs and SLIs defined; dashboards and alerts exist (link them).
2. Capacity: load test results against expected peak.
3. Failure: behavior when each dependency fails; rollback procedure tested.
4. Security: secrets handling, permissions, dependency scan.
5. Data: backups, restore tested, migrations reversible or gated.
6. Operations: runbook, on-call owner.

## Done when

- Every item has a linked artifact; gaps are listed with owners.
