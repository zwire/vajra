---
id: implement-ranker
title: Implement in the ranker
phase: expand
lifecycle: tracer
kind: work
writes: [ranker/**, serving/**, docs/**]
checks:
  - pytest ranker/tests
  - go test ./serving/...
  - python -m rankeval offline --judgments eval/judgments-2026q3 --model ranker --min-gain 0.003
  - go test -bench=Rank -benchtime=10s ./serving/ranker | python tools/check_budget.py --p99-ms 40
exits:
  - to: shadow-validation
    when: the change is merged and every check is green
---

# Implement in the ranker

## Purpose

Rebuild a decided change in `ranker/` and the Go serving path, written fresh from the decision record.

## Steps

1. Add the feature computation to `ranker/features/` with unit tests, written fresh; do not import from `experiments/`.
2. Add the online feature lookup to `serving/ranker/` with a fallback value when the lookup times out.
3. Retrain with `python -m ranker.train --snapshot data/snapshots/latest` and register the model id.
4. Run `python -m rankeval offline --judgments eval/judgments-2026q3 --model ranker` and compare with the experiment's number.
5. Run the latency benchmark and record p99 at 2k QPS.
6. Open a pull request with the decision record linked; merge when CI is green.

## Done when

- The offline gain reproduces within the experiment's spread, p99 is at most 40 ms in the benchmark, and the pull request is merged.

## Reply with

- Model id, offline gain, p99, and the PR link.
