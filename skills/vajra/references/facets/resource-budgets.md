# Facet: resource-budgets

Hard limits on time, memory, power or money: frame time, latency SLOs, memory on a device, battery, binary size, cloud spend, inference cost.

## Present when

- Exceeding a number is a failure even when the output is correct.
- The number depends on the target environment, not the developer's machine.

## Pin down in the domain model

- Each budget with its number, the target where it is measured, and the measurement command.
- Current headroom.
- Which changes typically eat the budget (assets, dependencies, allocations, queries).

## Evidence

- Measurements on the target environment against the budget, with the profiler or benchmark output linked.
- Regressions explained, not just noted.

## Graph changes

- Increments that touch hot paths include a measurement step on the target.
- Add a profiling playbook when budgets are tight: measure, find the top cost, change one thing, measure again.
- `harden` and promotion gates check every budget.

## Rails

- `checks`: benchmark or size commands that fail over budget.

## Questions

- Which numbers, if exceeded, make the product fail?
- Where are they measured, and how far from the limit are you now?
