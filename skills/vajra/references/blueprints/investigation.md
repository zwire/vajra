---
id: investigation
title: Investigation
phase: any
lifecycle: any
kind: service
exits:
  - to: end
    when: the answer cites evidence for each claim
  - to: frame-the-question
    when: the answer reveals an open problem worth exploring
---

# Investigation

## Purpose

Answer a read-only question about the code, system or options.

## Steps

1. Restate the question and what a useful answer looks like.
2. Read the relevant code and docs; run read-only commands.
3. Answer with references (file:line, command output). Mark inferences as inferences.

## Done when

- The answer cites evidence for each claim.
