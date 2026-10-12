# Facet: data-dependence

Behavior is learned from or derived from data, so the data is part of the product: trained models, heuristics tuned on samples, analyses, rule sets fit to logs.

## Present when

- Changing the data changes the behavior without a code change.
- There are training, tuning or evaluation sets, or a held-out set that must stay unseen.

## Pin down in the domain model

- Each dataset: source, version, owner, size, license, sensitive fields.
- The unit of leakage (user, session, recording, patient, day) and how splits respect it.
- The held-out set, who owns it, and what using it means.
- Labeling: who labels, the guideline, how labels are checked.

## Evidence

- Dataset version and datasheet (sources, counts, split, known gaps) linked in "Done when".
- Label quality: a spot-check rate and result.
- Evaluation always names the dataset version it ran on.

## Graph changes

- Add a dataset curation playbook when the data is built or extended by the team.
- Exploration uses train and validation data only. Touching the held-out set is an `[irreversible]` step behind a `[human-gate]`, usually inside the promotion gate.
- Add a data profiling step when sources are new: counts, nulls, ranges, duplicates, one cross-checked total.

## Rails

- `writes`: exploration playbooks cannot write dataset directories.
- `irreversible`: the command that evaluates on the held-out set.

## Questions

- What would leak between training and evaluation if you split naively?
- Who may look at the held-out set, and when?
- Is there personal or licensed data that limits where it can go?
