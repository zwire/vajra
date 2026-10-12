---
id: investigation
title: Investigation
phase: any
lifecycle: any
kind: service
terminal: true
exits:
  - to: bug-fix
    when: the answer reveals a defect
  - to: spike
    when: the answer reveals an open question worth exploring
---

# Investigation

## Purpose

Answer a read-only question about the code, bags, logs or trial results.

## Steps

1. Restate the question and what a useful answer looks like.
2. Read the relevant code, logs and bags; run only read-only commands. Never launch the real arm.
3. Answer with references (file:line, bag timestamps, log lines). Mark inferences as inferences.

## Done when

- Every claim in the answer cites evidence.

## Reply with

- The answer with its references.
