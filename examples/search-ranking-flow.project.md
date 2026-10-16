---
# Values of search-ranking-flow's bindings for this repository. Lives at .flow/search-ranking-flow/project.md.
# One line per name in the skill's bindings.md: a string, or a list [a, b].
ranker-test: pytest ranker/tests
serving-test: go test ./serving/...
offline-eval: python -m rankeval offline
judgments: eval/judgments-2026q3
heldout-eval: python -m rankeval offline --split heldout
latency-bench: "go test -bench=Rank -benchtime=10s ./serving/ranker | python tools/check_budget.py --p99-ms 40"
train: python -m ranker.train --snapshot data/snapshots/latest
shadow-deploy: make shadow-deploy
shadow-report: python -m rankeval shadow --since 24h
shadow-check: python -m rankeval shadow --model shadow --since 24h --max-p99-ms 40 --max-error-rate 0.001
snapshot-build: python -m rankdata snapshot --logs logs/clicks --exclude-week last
leakage-check: python -m rankdata check-leakage data/snapshots/latest --holdout-week last
ramp: abctl ramp
ab-report: abctl report
conclude: abctl conclude
rollback: abctl rollback
serving-rollback: make serving-rollback
ab-experiment: search-ranker-<id>
ranker-dir: ranker
ranker-features: ranker/features
serving-dir: serving
serving-lookup: serving/ranker
experiments-dir: experiments
click-logs: logs/clicks
snapshots: data/snapshots
datasheets: docs/datasheets
decisions: docs/decisions
docs: docs
latency-board: Grafana board "search-latency"
p99-budget-ms: 40
load-qps: 2k
max-error-rate: 0.1%
min-gain: 0.003
max-segment-loss: 0.005
guardrails: revenue per session ≥ −0.5%, zero-result rate ≤ +0.2 pt
---

# Project notes

Facts about this repository the workflow relies on. They stay here, not in the skill, so the skill stays reusable.

## Toolchain

| Purpose | Command or tool |
|---|---|
| Ranker tests | `pytest ranker/tests` |
| Serving tests | `go test ./serving/...` |
| Offline evaluation | `python -m rankeval offline --judgments eval/judgments-2026q3` |
| Latency benchmark | `go test -bench=Rank -benchtime=10s ./serving/ranker \| python tools/check_budget.py --p99-ms 40` |
| Shadow traffic | `make shadow-deploy MODEL=<id>`, `python -m rankeval shadow --since 24h` |
| A/B platform | `abctl ramp`, `abctl report`, `abctl conclude`, `abctl rollback` |
| VCS host / review | Pull requests; CI runs `pytest` and `go test` |

## Where things live

- Ranker (Python): `ranker/`, features in `ranker/features/`, tests in `ranker/tests`; retrained with `python -m ranker.train`.
- Serving (Go): `serving/`, online ranking and feature lookup in `serving/ranker/`; rolled back with `make serving-rollback`.
- Throwaway experiments: `experiments/<name>/`, never imported by `ranker/` or `serving/`.
- Click logs: `logs/clicks/`. Weekly snapshots (Mondays): `data/snapshots/`, `data/snapshots/latest` points at the current one; datasheets in `docs/datasheets/`.
- Judgment set: `eval/judgments-2026q3`. The held-out week is the most recent full week, excluded from every snapshot by `rankdata`.
- Decision records: `docs/decisions/<date>-<name>.md`.
- A/B experiments are named `search-ranker-<id>` on the `abctl` platform.
- Latency and errors: Grafana board "search-latency".
- Budgets (stated by the team): p99 ≤ 40 ms at 2k QPS; shadow error rate ≤ 0.1%; an offline gain below 0.003 NDCG@10 is noise; no segment may lose more than 0.005; A/B guardrails revenue per session ≥ −0.5%, zero-result rate ≤ +0.2 pt.
