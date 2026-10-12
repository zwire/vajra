# Facet: measured-outcome

Success is a number compared with a baseline: accuracy, latency, conversion, error rate, solve time.

## Present when

- Someone will ask "is it better?" and the answer is a metric.
- There is a baseline, or there should be one before any change is judged.

## Pin down in the domain model

- The metric, its unit, the direction of better, and the smallest difference that matters.
- The baseline and how it is reproduced (command, commit, config).
- The evaluation data or workload, and who may change it.
- Sources of variance: seeds, hardware, data order, traffic mix.

## Evidence

- "Done when" states metric vs baseline with variance (several seeds or runs, or a confidence interval), not one lucky run.
- The evaluation command is named and versioned; results link to the run.

## Graph changes

- Add a harness step or playbook before tuning: fix the metric, baseline and evaluation data first (blueprints: `poc` success criteria, `spike`).
- `decide`: "go" requires the improvement to exceed the smallest meaningful difference.
- Exploration may fan out over variants; comparison happens in one context against the same harness.

## Rails

- `checks`: the evaluation command with a threshold that fails the check when the metric regresses.
- `writes`: keep the evaluation set and harness outside paths that exploration playbooks may write.

## Questions

- What number would convince you, and what is it today?
- How noisy is it run to run?
- Who is allowed to change the evaluation data?
