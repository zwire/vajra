# Principles

Apply these throughout. When a principle changes a decision, name it in your reply.

## Fix the yardstick first

Judge every idea with `python -m rankeval offline` against `eval/judgments-2026q3` and the current production ranker as baseline; never change the judgment set in the same run as the ranker. Applies to offline-experiment and implement-ranker.

## Three seeds or it did not happen

Report NDCG@10 as mean and spread over three seeds; a gain smaller than 0.003 is noise. Applies to offline-experiment and decide.

## The held-out week is spent once

`--split heldout` runs only at the ramp gate, after the product owner approves. Applies to ab-ramp.

## Throwaway means throwaway

Experiment code lives in `experiments/<name>/` and is never imported by `ranker/` or `serving/`. Applies to frame-hypothesis, offline-experiment and decide.

## Latency is a feature

p99 above 40 ms at 2k QPS fails the change, however good the ranking. Applies to implement-ranker and shadow-validation.

## Gate the irreversible

Users see a ranking only after a human approves the ramp stage. Applies wherever a step is tagged `[irreversible]`.
