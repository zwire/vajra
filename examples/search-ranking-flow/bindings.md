---
ranker-test: command that runs the ranker's unit tests and exits non-zero on failure
serving-test: command that runs the serving layer's tests and exits non-zero on failure
offline-eval: command that scores a model offline against a judgment set (takes --judgments, --model and --seeds)
judgments: frozen judgment set every offline evaluation is scored on
heldout-eval: command that evaluates a model on the held-out week (spent once, at the ramp gate)
latency-bench: command that runs the serving latency benchmark and exits non-zero when p99 breaks the budget
train: command that retrains the ranker on the latest snapshot and registers a model id
shadow-deploy: command that deploys a model to shadow traffic (takes MODEL=<id>)
shadow-report: command that reports a shadow model's latency, errors and overlap with control (takes --model)
shadow-check: command that fails when the shadow model broke the latency or error budget over the last 24 h
snapshot-build: command that builds a training snapshot from click logs with the held-out week excluded (takes --out)
leakage-check: command that fails when the latest snapshot overlaps the held-out week
ramp: A/B platform command that sets an experiment's exposure (takes the experiment and --percent)
ab-report: A/B platform command that reports an experiment's metrics and significance
conclude: A/B platform command that ships an experiment's winner to all traffic
rollback: A/B platform command that rolls an experiment back to control
serving-rollback: command that rolls the serving layer back to its previous release
ab-experiment: name of the A/B experiment for model <id>
ranker-dir: directory of the ranker code and its tests
ranker-features: directory of the ranker's feature computations
serving-dir: directory of the serving layer
serving-lookup: directory of the serving layer's online ranking and feature lookup
experiments-dir: directory where throwaway offline experiments live, one subdirectory each
click-logs: location of the raw click logs
snapshots: directory of the training snapshots, with latest pointing at the current one
datasheets: directory of the snapshot datasheets
decisions: directory of the decision records
docs: directory of the project's documentation
latency-board: dashboard that shows serving p99 latency and error rate by hour
p99-budget-ms: p99 serving latency budget in milliseconds
load-qps: request rate at which the latency budget must hold
max-error-rate: highest serving error rate shadow traffic may show
min-gain: smallest NDCG@10 gain over control that counts as a win rather than noise
max-segment-loss: largest NDCG@10 loss any query segment may show in a winning change
guardrails: A/B guardrail metrics and their limits, besides the latency budget
---

# Bindings

Every value that changes from one repository to the next is a binding: commands, paths and globs, URLs, branch names, project keys, dashboards, thresholds of one service. Playbooks, the router and the principles write `${name}`; each project gives the value in `.flow/search-ranking-flow/project.md`. The skill itself names no repository, so it can be copied into any project of this kind.

A value is a string, or a list `[a, b]` (several globs or commands). The runtime fills the values in when it runs checks, guards commands and limits edits, and `flow status` shows them for the active playbook.
