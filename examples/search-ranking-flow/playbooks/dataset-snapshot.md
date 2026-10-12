---
id: dataset-snapshot
title: Dataset snapshot
phase: any
lifecycle: any
kind: service
writes: [data/snapshots/**, docs/datasheets/**]
checks:
  - python -m rankdata check-leakage data/snapshots/latest --holdout-week last
exits:
  - to: end
    when: the snapshot and its datasheet are published and the leakage check is green
---

# Dataset snapshot

## Purpose

Build the weekly training snapshot from click logs without leaking the held-out week.

## Steps

1. Run `python -m rankdata snapshot --logs logs/clicks --exclude-week last --out data/snapshots/<date>`.
2. Write `docs/datasheets/<date>.md`: query and click counts, date range, excluded week, known gaps.
3. Spot-check 50 random sessions for bot traffic and duplicated clicks.
4. Point `data/snapshots/latest` at the new snapshot.

## Done when

- The snapshot, its datasheet and the spot-check result exist, and the leakage check passes.

## Reply with

- Snapshot path, counts, and spot-check result.
