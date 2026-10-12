---
id: release-gate
title: Release gate
phase: extract
lifecycle: any
kind: gate
promotes: tracer->hardened
exits:
  - to: end
    when: the release is live and verified
  - to: build-to-spec
    when: no-go because the build misses the spec
  - to: bug-fix
    when: no-go because of open defects
---

# Release gate

## Purpose

Go / no-go for a release in plan-driven or QA-led flows.

## Steps

1. Gather the verification report, open defects by severity, and traceability status.
2. Apply the release criteria (⟨criteria⟩).
3. [human-gate] Record the go / no-go and who approved.
4. [irreversible] On go, release with ⟨deploy command⟩ and verify it is live.

## Done when

- Release is live and verified, or no-go is recorded with the blocking items.
