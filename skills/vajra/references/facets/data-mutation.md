# Facet: data-mutation

Changes alter persistent data others rely on: schema migrations, backfills, bulk updates, reprocessing, writes to shared tables or buckets.

## Present when

- A mistake leaves wrong or missing data that code changes alone cannot fix.
- Data volume makes changes slow, so a bad run is costly to redo.

## Pin down in the domain model

- The stores, their backups, and how a restore is done and how long it takes.
- How a change is dry-run (copy, sample, staging) and how results are reconciled (row counts, checksums, totals).
- Whether jobs are idempotent and resumable.

## Evidence

- Dry-run output on a copy with reconciliation numbers.
- A restore tested recently, with its duration.
- After the real run: the same reconciliation numbers on production.

## Graph changes

- Add a migration or backfill playbook: plan, dry run, reconcile, `[human-gate]`, `[irreversible]` apply, reconcile again.
- Schema changes follow expand-then-contract when code and data deploy separately.

## Rails

- `checks`: the reconciliation query or script.
- `irreversible`: the apply commands (migration runners, backfill jobs, bulk scripts).

## Questions

- If this goes wrong at 3 a.m., how do you get the data back, and how long does it take?
- Can the job be re-run safely?
- Who else reads this data?
