# Calibration

Worked excerpts that show how concrete a generated skill must be. They come from different domains on purpose: read them for the level of detail, never copy their content into another domain.

## Domain model at two resolutions

Search ranking for an e-commerce site needs two areas, because the model and the serving path differ in facets, evidence and irreversible actions:

| Field | Ranking model | Serving path |
|---|---|---|
| Facets | measured-outcome, data-dependence | resource-budgets, stand-in-ladder |
| Smallest convincing evidence | NDCG@10 mean ± spread over 3 seeds vs control on `eval/judgments-2026q3`, gain ≥ 0.003 | p99 ≤ 40 ms at 2k QPS from the benchmark; shadow error rate ≤ 0.1% |
| Evidence ladder | offline judgments → held-out week (once) → A/B revenue per session | benchmark → 24 h shadow traffic → A/B guardrails at 1% → 50% → 100% |
| Cheap experiment | script in `experiments/<name>/` on the current snapshot, train split only | none; serving changes are always built for real |
| Irreversible actions | held-out evaluation — `python -m rankeval offline --split heldout` | ramp — `abctl ramp`; ship to 100% — `abctl conclude` |
| Lead times | weekly snapshot on Mondays | A/B needs 7 days for significance |
| Tools and vocabulary | click logs in `logs/clicks/`, snapshots in `data/snapshots/` | Go service `serving/`, dashboard "search-latency" |

A B2B invoicing product run in sprints needs no more than this to change the graph:

| Field | Product and public API | Data |
|---|---|---|
| Facets | shared-contracts | data-mutation |
| Smallest convincing evidence | acceptance criteria shown on staging; `pnpm test:contract` green; `pnpm openapi:diff` reports no breaking change | `pnpm db:migrate --dry-run` on the staging copy with row counts |
| Irreversible actions | release — `pnpm release`; removing an API field after its sunset date | production migrations, run by `pnpm release` |
| Lead times | 90 days' notice before an API field is removed | restore drill takes 40 minutes |

## A playbook before and after the domain model

Before: a blueprint with nothing domain-specific. The validator flags it, and it fails the swap test because it would read the same in any domain.

```markdown
## Steps

1. Deploy the change to a test environment.
2. Observe its behavior for a while.
3. Check that nothing broke.

## Done when

- It works as expected.
```

After: the same job for the search serving path. The steps name real commands, the evidence is what a search engineer would accept, and the check routes the run mechanically.

```markdown
---
id: shadow-validation
title: Shadow validation
phase: expand
lifecycle: tracer
kind: work
checks:
  - python -m rankeval shadow --model shadow --since 24h --max-p99-ms 40 --max-error-rate 0.001
exits:
  - to: ab-ramp
    when: 24 hours of shadow traffic stayed within the budget
    on: pass
  - to: implement-ranker
    when: latency or errors broke the budget
    on: fail
---

## Steps

1. Deploy to shadow with `make shadow-deploy MODEL=<id>`; shadow serves no user.
2. Let it run 24 hours, then run `python -m rankeval shadow --model <id> --since 24h`.
3. Compare result overlap with control on the top 1,000 queries and read ten queries with the largest change.
4. Check the "search-latency" dashboard for p99 and error rate by hour.

## Done when

- The shadow report shows p99 ≤ 40 ms and error rate ≤ 0.1% over 24 h, with the overlap numbers and ten changed queries reviewed.
```

## Rails on a gate with stages

Each irreversible step names its command, and each stage has its own human gate. The runtime ties a guarded command to the first pending step that mentions it, so the 50% ramp waits for the second approval even though the first one was given.

```markdown
---
id: ab-ramp
kind: gate
promotes: tracer->hardened
irreversible:
  - rankeval offline --split heldout
  - abctl ramp
  - abctl conclude
---

## Steps

1. Summarize the offline gain, shadow report and decision record for the product owner.
2. [human-gate] The product owner approves the held-out evaluation and the 1% stage.
3. [irreversible] Run `python -m rankeval offline --split heldout --model <id>` once and record the result.
4. [irreversible] Start the 1% stage with `abctl ramp search-ranker-<id> --percent 1`.
5. After 24 h, read `abctl report search-ranker-<id>` against every guardrail.
6. [human-gate] The product owner approves widening, with the held-out and 1% results in front of them.
7. [irreversible] Widen with `abctl ramp search-ranker-<id> --percent 50` and wait for significance.
8. [irreversible] Ship the winner with `abctl conclude search-ranker-<id> --winner treatment`.
```

## Physical safety in rails, not prose

For a robot arm, the launch file that moves the real arm is guarded, and no playbook lists the safety limits in `writes`, so changing them needs the operator by hand:

```yaml
# hardware-trial (gate)
irreversible:
  - tools/eval_detector.py --split heldout
  - real.launch.py

# increment (work)
writes: [src/**, test/**, launch/**, config/perception/**, docs/**]
checks:
  - colcon build --symlink-install
  - colcon test && colcon test-result --verbose
```

## Regulated pass and fail routing

In plan-driven, regulated work the trace check decides where the run goes, not the agent's reading of the report:

```yaml
checks:
  - scripts/run-system-tests.sh --target simulator
  - scripts/trace-check.py --require-results
exits:
  - to: release-gate
    when: every SRS id has a passing result or an accepted deviation
    on: pass
  - to: problem-report
    when: a test failed or an SRS id has no result
    on: fail
```
