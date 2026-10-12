---
id: investigation
title: Investigation
phase: any
lifecycle: any
kind: service
terminal: true
exits:
  - to: frame-hypothesis
    when: the answer reveals a ranking idea worth testing
---

# Investigation

## Purpose

Answer a read-only question about click logs, experiments, dashboards or code.

## Steps

1. Restate the question and what a useful answer looks like.
2. Read the relevant logs, `experiments/`, `docs/decisions/` and code; run only read-only queries.
3. Answer with references (file:line, query text, dashboard panel). Mark inferences as inferences.

## Done when

- Every claim in the answer cites evidence.

## Reply with

- The answer with its references.
