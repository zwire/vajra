---
id: harden
title: Harden
phase: expand
lifecycle: tracer
kind: work
exits:
  - to: production-readiness
    when: the graph has a production-readiness playbook
  - to: promote-to-production
    when: tests pass and the shortcut list is empty or accepted
---

# Harden

## Purpose

Raise kept code from exploration quality to production quality, safely.

## Steps

1. Pin current behavior with characterization tests before changing anything.
2. Clean boundaries: types, error handling, input validation, configuration out of code.
3. Remove shortcuts listed in the learning log or decision record.
4. Add observability: structured logs, metrics, health checks.
5. Raise verification to the profile's level (discipline ratchet).

## Done when

- Characterization and new tests pass, shortcuts list is empty or accepted, observability is in place.
