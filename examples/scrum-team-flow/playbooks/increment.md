---
id: increment
title: Increment
phase: expand
lifecycle: tracer
kind: work
checks:
  - pnpm test
  - pnpm lint
  - pnpm typecheck
exits:
  - to: api-change
    when: the story changes the public REST API
  - to: increment
    when: another committed story is not done yet
  - to: sprint-review
    when: every committed story is done or returned to the backlog
---

# Increment

## Purpose

Turn one committed story into a reviewed, tested change on `main`.

## Steps

1. Restate the story's acceptance criteria as observable behavior.
2. Implement the smallest change that satisfies them on a feature branch.
3. Write or update tests that pin the new behavior.
4. Run `pnpm test`, `pnpm lint` and `pnpm typecheck`.
5. Open a GitHub pull request linking the story; drive CI to green.
6. Get one approving review, then merge to `main`.

## Done when

- Every acceptance criterion is shown met on `https://staging.example.com` or in a test, `pnpm test` is green in CI, and the PR is merged with an approving review.

## Reply with

- The PR link, criteria with evidence, and the next story or exit.
