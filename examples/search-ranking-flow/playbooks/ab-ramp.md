---
id: ab-ramp
title: A/B ramp
phase: extract
lifecycle: any
kind: gate
promotes: tracer->hardened
irreversible:
  - ${heldout-eval}
  - ${ramp}
  - ${conclude}
exits:
  - to: end
    when: the experiment concluded and the winner serves 100%
  - to: implement-ranker
    when: a guardrail was breached or the product owner stopped the ramp
---

# A/B ramp

## Purpose

Promotion gate from tracer to hardened: spend the held-out week, then expose real users stage by stage with sign-off.

## Parameters

- Stages: 1% for 24 h, then 50% until significance (about 7 days), then 100%
- Guardrails: ${guardrails}, p99 ≤ ${p99-budget-ms} ms

## Steps

1. Summarize the offline gain, shadow report and decision record for the product owner.
2. [human-gate] The product owner approves the held-out evaluation and the 1% stage.
3. [irreversible] Run `${heldout-eval} --model <id>` once and record the result.
4. [irreversible] Start the 1% stage with `${ramp} ${ab-experiment} --percent 1`.
5. After 24 h, read `${ab-report} ${ab-experiment}` against every guardrail.
6. [human-gate] The product owner approves widening, with the held-out and 1% results in front of them.
7. [irreversible] Widen with `${ramp} ${ab-experiment} --percent 50` and wait for significance in `${ab-report}`.
8. [irreversible] Ship the winner with `${conclude} ${ab-experiment} --winner treatment`.

## Done when

- `${ab-report} ${ab-experiment} --final` shows significance and no breached guardrail, and the conclusion is recorded in the decision record; or the rollback and its reason are recorded.

## Reply with

- Held-out result, stage results against guardrails, approvals, and the final report.
