# Facets

A facet is a trait of the work that changes the workflow: what counts as evidence, where gates go, which actions are irreversible, which rails to install. Facets cut across domains. A shader, a playtest and a photo filter share `perceptual-output`; a robot arm, a firmware update and a payment migration share an irreversible step that needs a human.

There are no domain presets. For each user, build a [domain model](../domain-model.md) at the resolution their work needs, and use the facets as the checklist that makes sure nothing graph-changing is missed. Domain knowledge itself (tools, file formats, standards, failure modes) comes from the repository, the user, and what you know about the field. Make it concrete; the facets only say where it must show up.

| Facet | Present when | Main effect on the graph |
|---|---|---|
| [measured-outcome](measured-outcome.md) | Success is a number compared with a baseline | A fixed evaluation harness before tuning; variance-aware "Done when" |
| [perceptual-output](perceptual-output.md) | Success is judged by eyes, ears or hands | Golden references with tolerances; structured human review |
| [data-dependence](data-dependence.md) | Behavior is learned from or derived from data | Dataset versioning; held-out data used once, behind a gate |
| [stand-in-ladder](stand-in-ladder.md) | The real target is slow, costly or dangerous, and cheaper stand-ins exist | One rung per stand-in, each a gate; never skip a rung |
| [physical-world](physical-world.md) | Software moves, powers, or can brick something physical | Safety checklist, operator, guarded commands; safety rules win |
| [shared-contracts](shared-contracts.md) | Others consume an interface you change | Expand-then-contract; consumer checks before removal |
| [data-mutation](data-mutation.md) | Changes alter persistent data others rely on | Dry run on a copy, tested restore, guarded apply |
| [external-release](external-release.md) | Releasing passes through someone else | Lead times, submission checklist, staged rollout gate |
| [resource-budgets](resource-budgets.md) | Hard limits on time, memory, power or money | Budgets measured on target, regression checks |
| [reproducibility](reproducibility.md) | Others must be able to re-derive the result | Pinned environment, raw-to-result re-run as a check |

## How to use them

1. While building the domain model, ask each facet's "Present when" questions only as far as the answers change the graph. Most projects have two to four facets.
2. A facet can apply to one area of the work and not another (perception has `data-dependence`, the arm controller has `physical-world`). Record facets per area.
3. For each present facet, apply its graph changes and rails in [composition](../composition.md) rule 3, written in the domain's own terms: name the real simulator, metric, dataset, store or device. A facet that ends up in a playbook as generic wording has not been applied.
4. Record the facets in the profile frontmatter (`facets: [...]`) and the details in `## Domain model`. The validator checks the facets against the graph.
