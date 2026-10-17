---
id: ship
title: Ship
phase: any
lifecycle: any
kind: work
writes: [${code}]
checks:
  - ${test}
exits:
  - to: end
    when: the PR is merged and the release is tagged
  - to: bug-fix
    when: CI or review finds a defect
---

# Ship

## Purpose

Merge a trialed change and tag it as the version the lab arm runs by default.

## Steps

1. Link `${trials}/<date>/` in the pull request description.
2. Drive CI to green. Fix root causes; never skip a test.
3. Merge, then tag the release with `git tag ${tag} && git push ${remote} ${tag}`.

## Done when

- The pull request is merged with `${trials}/<date>/` linked, and `git tag --list ${tag}` shows the tag.

## Reply with

- The PR link and the tag.
