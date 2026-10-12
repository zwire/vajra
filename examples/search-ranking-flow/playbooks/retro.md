---
id: retro
title: Retro
phase: any
lifecycle: any
kind: service
exits:
  - to: end
    when: changes are recorded and the workflow is updated or explicitly kept
---

# Retro

## Purpose

Learn from a concluded experiment, including whether this workflow should change.

## Steps

1. Compare the offline gain, held-out result and A/B result. Where did the prediction break?
2. For each surprise, find the playbook and step where better evidence would have caught it.
3. Propose at most three changes. Prefer a new check or a tighter threshold over a new rule.
4. If the workflow should change, run vajra in Evolve mode on this skill.

## Done when

- The comparison and changes are recorded in the decision record, and this skill is updated or explicitly kept.

## Reply with

- The prediction gaps and the changes.
