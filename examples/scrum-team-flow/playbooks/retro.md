---
id: retro
title: Retro
phase: any
lifecycle: any
kind: service
exits:
  - to: end
    when: action items are recorded and the workflow is updated or explicitly kept
---

# Retro

## Purpose

Turn the sprint's experience into structural change, including changes to this workflow skill.

## Steps

1. Collect what went well, what hurt, and what surprised, from the team and the sprint data.
2. For each pain, find the playbook and step where it entered.
3. Propose at most three action items. Prefer editing a step or gate over adding a rule.
4. If the workflow should change, run vajra in Evolve mode on this skill.

## Done when

- Action items are in Jira, and this skill is updated or explicitly kept as is.

## Reply with

- The action items and whether the workflow was evolved.
