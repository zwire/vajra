---
id: sprint-review
title: Sprint review
phase: any
lifecycle: any
kind: work
exits:
  - to: qa-exploratory
    when: accepted stories should go out in the next release
  - to: retro
    when: nothing accepted needs releasing
---

# Sprint review

## Purpose

Show what was built against the sprint goal and collect the PO's verdict.

## Steps

1. List each committed story against the Definition of Done, with evidence links.
2. Demo each done story on `${staging-url}`: screenshots, recordings or API calls.
3. [human-gate] Wait for the PO to accept or return each story.
4. File feedback and returned stories as backlog items.

## Done when

- Each story in the `${tracker-project}` sprint is marked accepted or returned with reasons, demo recordings are linked, and feedback is filed as new `${tracker-project}` issues.

## Reply with

- Accepted and returned stories, and the backlog items created.
