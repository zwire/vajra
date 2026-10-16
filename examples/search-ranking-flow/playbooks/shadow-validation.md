---
id: shadow-validation
title: Shadow validation
phase: expand
lifecycle: tracer
kind: work
checks:
  - ${shadow-check}
exits:
  - to: ab-ramp
    when: 24 hours of shadow traffic stayed within the budget
    on: pass
  - to: implement-ranker
    when: latency or errors broke the budget
    on: fail
---

# Shadow validation

## Purpose

Run the new ranker on mirrored production traffic, invisible to users, before any exposure.

## Steps

1. Deploy to shadow with `${shadow-deploy} MODEL=<id>`; shadow serves no user.
2. Let it run 24 hours, then run `${shadow-report} --model <id>`.
3. Compare result overlap with control on the top 1,000 queries and read ten queries with the largest change.
4. Check `${latency-board}` for p99 and error rate by hour.

## Done when

- The shadow report shows p99 ≤ `${p99-budget-ms}` ms and error rate ≤ `${max-error-rate}` over 24 h, with the overlap numbers and ten changed queries reviewed.

## Reply with

- Shadow p99, error rate, overlap, and notable query changes.
