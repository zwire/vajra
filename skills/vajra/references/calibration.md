# Calibration

Worked excerpts that show how concrete a generated skill must be. They come from different domains on purpose: read them for the level of detail, never copy their content into another domain. Every value that belongs to one repository is a `${binding}`; the project file that gives the values is shown where it matters.

## Domain model at two resolutions

Search ranking for an e-commerce site needs two areas, because the model and the serving path differ in facets, evidence and irreversible actions:

| Field | Ranking model | Serving path |
|---|---|---|
| Facets | measured-outcome, data-dependence | resource-budgets, stand-in-ladder |
| Smallest convincing evidence | NDCG@10 mean ± spread over 3 seeds vs control on `${judgments}`, gain ≥ `${min-gain}` | p99 ≤ `${p99-budget}` at peak QPS from `${latency-bench}`; shadow error rate ≤ `${max-error-rate}` |
| Evidence ladder | offline judgments → held-out week (once) → A/B revenue per session | benchmark → 24 h shadow traffic → A/B guardrails at 1% → 50% → 100% |
| Cheap experiment | script under `${experiments}` on the current snapshot, train split only | none; serving changes are always built for real |
| Irreversible actions | held-out evaluation — `${heldout-eval}` | ramp — `${ramp}`; ship to 100% — `${conclude}` |
| Lead times | weekly snapshot on Mondays | A/B needs 7 days for significance |
| Tools and vocabulary | click logs in `${click-logs}`, weekly snapshots in `${snapshots}` | Go serving service in `${serving}`, latency dashboard `${latency-dashboard}` |

A B2B invoicing product run in sprints needs no more than this to change the graph:

| Field | Product and public API | Data |
|---|---|---|
| Facets | shared-contracts | data-mutation |
| Smallest convincing evidence | acceptance criteria shown on `${staging-url}`; `${contract-test}` green; `${api-diff}` reports no breaking change | `${migrate-dry-run}` on the staging copy with row counts |
| Irreversible actions | release — `${release}`; removing an API field after its sunset date | production migrations, run by `${release}` |
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

After: the same job for the search serving path. The steps name real commands through bindings, the evidence is what a search engineer would accept, and the check routes the run mechanically. The skill stays the same in the next search service; only the project file changes.

```markdown
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

## Steps

1. Deploy to shadow with `${shadow-deploy}`; shadow serves no user.
2. Let it run 24 hours, then run `${shadow-check}`.
3. Compare result overlap with control on the top 1,000 queries and read ten queries with the largest change.
4. Check `${latency-dashboard}` for p99 and error rate by hour.

## Done when

- The shadow report shows p99 ≤ `${p99-budget}` and error rate ≤ `${max-error-rate}` over 24 h, with the overlap numbers and ten changed queries reviewed.
```

And in that repository's `.flow/search-ranking-flow/project.md`:

```yaml
---
shadow-deploy: make shadow-deploy
shadow-check: python -m rankeval shadow --model shadow --since 24h --max-p99-ms 40 --max-error-rate 0.001
latency-dashboard: Grafana "search-latency"
p99-budget: 40 ms
max-error-rate: 0.1%
---
```

## Rails on a gate with stages

Each irreversible step names its command, and each stage has its own human gate. The runtime ties a guarded command to the first pending step that mentions it, so the 50% ramp waits for the second approval even though the first one was given.

```markdown
---
id: ab-ramp
kind: gate
promotes: tracer->hardened
irreversible:
  - ${heldout-eval}
  - ${ramp}
  - ${conclude}
---

## Steps

1. Summarize the offline gain, shadow report and decision record for the product owner.
2. [human-gate] The product owner approves the held-out evaluation and the 1% stage.
3. [irreversible] Run `${heldout-eval} --model <id>` once and record the result.
4. [irreversible] Start the 1% stage with `${ramp} search-ranker-<id> --percent 1`.
5. After 24 h, read `${ab-report} search-ranker-<id>` against every guardrail.
6. [human-gate] The product owner approves widening, with the held-out and 1% results in front of them.
7. [irreversible] Widen with `${ramp} search-ranker-<id> --percent 50` and wait for significance.
8. [irreversible] Ship the winner with `${conclude} search-ranker-<id> --winner treatment`.
```

## Physical safety in rails, not prose

For a robot arm, the launch file that moves the real arm is guarded, and no playbook lists the safety limits in `writes`, so changing them needs the operator by hand. The globs are bindings, so a second robot repository lists its own directories, and the safety limits stay out of every list there too:

```yaml
# hardware-trial (gate)
irreversible:
  - ${heldout-eval}
  - ${real-launch}

# increment (work)
writes: [${code}]
checks:
  - ${build}
  - ${test}

# .flow/robot-grasp-flow/project.md
code: [src/**, test/**, launch/**, config/perception/**, docs/**]
real-launch: real.launch.py
build: colcon build --symlink-install
test: colcon test && colcon test-result --verbose
```

## Regulated pass and fail routing

In plan-driven, regulated work the trace check decides where the run goes, not the agent's reading of the report:

```yaml
checks:
  - ${integration-tests}
  - ${trace-check-results}
exits:
  - to: release-gate
    when: every SRS id has a passing result or an accepted deviation
    on: pass
  - to: problem-report
    when: a test failed or an SRS id has no result
    on: fail
```
