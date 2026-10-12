---
id: frame-the-question
title: Frame the question
phase: explore
lifecycle: throwaway
kind: work
exits:
  - to: spike
    when: the question is technical feasibility
  - to: prototype
    when: the question is about design or experience
  - to: poc
    when: a stakeholder must see feasibility against agreed criteria
  - to: mvp-experiment
    when: the question is whether users value it
  - to: investigation
    when: the answer probably already exists in the code or docs
---

# Frame the question

## Purpose

Turn a vague goal into one question whose answer decides the next move.

## Steps

1. Restate the goal in one sentence. List what is known, assumed, and unknown.
2. Write candidate questions of the form "If we knew ⟨X⟩, we would do ⟨Y⟩".
3. Pick the question with the highest decision value per unit of effort.
4. Choose the probe: `spike` (technical feasibility), `prototype` (experience or design), `poc` (feasibility a stakeholder must see), `mvp-experiment` (user value).
5. Set the timebox: ⟨timebox⟩.

## Done when

- One question, the chosen probe, a timebox, and the result that would change the plan are written down.
