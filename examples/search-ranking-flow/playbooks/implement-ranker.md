---
id: implement-ranker
title: Implement in the ranker
phase: expand
lifecycle: tracer
kind: work
writes: [${ranker-dir}/**, ${serving-dir}/**, ${docs}/**]
checks:
  - ${ranker-test}
  - ${serving-test}
  - ${offline-eval} --judgments ${judgments} --model ${ranker-dir} --min-gain ${min-gain}
  - ${latency-bench}
exits:
  - to: shadow-validation
    when: the change is merged and every check is green
---

# Implement in the ranker

## Purpose

Rebuild a decided change in `${ranker-dir}` and the Go serving path, written fresh from the decision record.

## Steps

1. Add the feature computation to `${ranker-features}` with unit tests, written fresh; do not import from `${experiments-dir}`.
2. Add the online feature lookup to `${serving-lookup}` with a fallback value when the lookup times out.
3. Retrain with `${train}` and register the model id.
4. Run `${offline-eval} --judgments ${judgments} --model ${ranker-dir}` and compare with the experiment's number.
5. Run `${latency-bench}` and record p99 at `${load-qps}` QPS.
6. Open a pull request with the decision record linked; merge when CI is green.

## Done when

- The offline gain reproduces within the experiment's spread, p99 is at most `${p99-budget-ms}` ms in the benchmark, and the pull request is merged.

## Reply with

- Model id, offline gain, p99, and the PR link.
