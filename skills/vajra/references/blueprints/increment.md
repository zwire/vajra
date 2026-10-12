---
id: increment
title: Increment
phase: expand
lifecycle: tracer
kind: work
exits:
  - to: ship
    when: flow cadence and the slice is done
  - to: sprint-review
    when: sprint cadence and the committed items are done
  - to: harden
    when: the journey moves to extract
  - to: increment
    when: another slice of the same item remains
---

# Increment

## Purpose

Deliver one slice of new or changed behavior.

## Steps

1. Name the data shape and the behavior change.
2. ⟨verification: write the failing test first (tdd) / plan tests (test-after)⟩
3. Implement the smallest change that satisfies the acceptance criteria.
4. Run ⟨test command⟩, ⟨lint command⟩, ⟨typecheck command⟩.
5. ⟨review: self-review checklist / independent review in a fresh context⟩

## Done when

- Acceptance criteria are shown met with evidence; checks pass.
