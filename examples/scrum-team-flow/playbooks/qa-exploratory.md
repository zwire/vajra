---
id: qa-exploratory
title: Exploratory QA
phase: any
lifecycle: any
kind: service
exits:
  - to: bug-fix
    when: a charter found a defect that blocks the release
  - to: release-gate
    when: all charters ran and no blocking defect is open
---

# Exploratory QA

## Purpose

Find defects in the release candidate that the scripted suite misses.

## Parameters

- Timebox: 45 minutes per charter
- Parallelism: independent charters run in parallel; findings are merged in one context

## Steps

1. Write charters for the changed areas: "Explore ⟨area⟩ with ⟨data or role⟩ to discover ⟨risk⟩", ordered by impact × likelihood.
2. Run independent charters in parallel on `${staging-url}`.
3. Log observations and defects with reproduction steps and severity.
4. File each defect in Jira project `${tracker-project}` with a proposed regression test.

## Done when

- Every charter has run, with findings logged and defects filed.

## Reply with

- Charters run, defects by severity, and whether any blocks the release.
