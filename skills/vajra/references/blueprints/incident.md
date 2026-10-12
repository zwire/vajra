---
id: incident
title: Incident
phase: extract
lifecycle: any
kind: service
exits:
  - to: bug-fix
    when: the root cause needs a code fix
  - to: retro
    when: the postmortem calls for a workflow change
  - to: end
    when: the postmortem and its action items are filed
---

# Incident

## Purpose

Respond to production impact and learn from it without blame.

## Steps

1. Run `stabilize` steps if impact is ongoing.
2. Communicate status to ⟨channel⟩. ⟨[human-gate] before external communication⟩
3. Find the root cause with evidence.
4. Write the postmortem: timeline, cause, contributing factors, action items.
5. File action items as `bug-fix`, `regression-suite` or workflow changes (retro).

## Done when

- Impact is resolved and the postmortem with action items exists.
