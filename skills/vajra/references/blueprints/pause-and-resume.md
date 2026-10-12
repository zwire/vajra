---
id: pause-and-resume
title: Pause and resume
phase: any
lifecycle: any
kind: service
exits:
  - to: end
    when: the handoff note is written
---

# Pause and resume

## Purpose

Suspend long work cleanly and resume it in a later session.

## Steps

1. Write a handoff note: current playbook and step, done items with evidence, next action, open questions.
2. Commit or stash work in progress on a branch, never on the main line.
3. On resume: read the note, verify the state still matches, continue at the recorded step.

## Done when

- The note lets a fresh session continue without asking the user anything.
