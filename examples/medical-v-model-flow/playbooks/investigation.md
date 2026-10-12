---
id: investigation
title: Investigation
phase: any
lifecycle: any
kind: service
terminal: true
exits:
  - to: problem-report
    when: the answer reveals a defect
---

# Investigation

## Purpose

Answer a read-only question about the code, the trace matrix or the records.

## Steps

1. Restate the question and what a useful answer looks like.
2. Read the relevant code and documents; run only read-only commands.
3. Answer with references (file:line, document ids). Mark inferences as inferences.

## Done when

- Every claim in the answer cites evidence.

## Reply with

- The answer with its references.
