---
id: spike
title: Spike
phase: explore
lifecycle: throwaway
kind: work
exits:
  - to: decide
    when: the learning log states an answer with evidence
  - to: frame-the-question
    when: the spike showed the question was wrong
  - to: end
    when: the answer is a clear no-go
---

# Spike

## Purpose

Answer one technical question quickly. The output is knowledge, not code.

## Steps

1. Write the question and the timebox (⟨timebox⟩) at the top of a scratch file.
2. Work in an isolated scratch location (⟨scratch path⟩), never in production source.
3. Build the least code that produces an observation. No tests, abstractions or cleanup.
4. Record each attempt in a learning log: tried, observed, concluded.
5. Stop at the answer or at the timebox, whichever comes first.

## Done when

- The learning log states the answer (or "unknown after timebox") with observed evidence, and the scratch code is labeled throwaway.
