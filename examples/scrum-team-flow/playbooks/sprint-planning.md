---
id: sprint-planning
title: Sprint planning
phase: any
lifecycle: any
kind: work
exits:
  - to: increment
    when: the sprint goal and committed stories are recorded
---

# Sprint planning

## Purpose

Commit to a sprint goal and the stories that serve it.

## Steps

1. Read the top of the Jira backlog for project `${tracker-project}` and the action items from the last retro.
2. Propose a sprint goal and the stories that serve it, sized to the team's recent velocity.
3. Check each story meets the Definition of Ready: acceptance criteria, design notes, no open dependency.
4. [human-gate] Present the goal and stories, and wait for the PO's confirmation.

## Done when

- The sprint goal and committed stories are recorded in the active `${tracker-project}` sprint in Jira, each meeting the Definition of Ready.

## Reply with

- The sprint goal, the committed stories, and any story sent back to refinement.
