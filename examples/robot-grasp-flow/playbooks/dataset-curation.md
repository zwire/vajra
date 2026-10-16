---
id: dataset-curation
title: Dataset curation
phase: expand
lifecycle: tracer
kind: work
writes: [${dataset}/**, ${datasheets}/**]
checks:
  - ${check-split} ${dataset} --by session
exits:
  - to: increment
    when: the dataset is versioned and its split is documented
---

# Dataset curation

## Purpose

Collect and label the images the detector needs, with a held-out set that stays untouched.

## Steps

1. Write the data gap: which objects, lighting and poses are missing.
2. Record new images from the lab camera or extract frames from bags.
3. Label them and spot-check 5% of labels in a fresh context.
4. Split train, validation and held-out sets by recording session, never by frame.
5. Version the dataset and write its datasheet: sources, counts, split, known gaps.

## Done when

- `${datasheets}/<version>.md` exists, the label spot-check agrees on at least 98% of boxes, and `${check-split}` confirms no recording session spans two splits.

## Reply with

- The dataset version, counts per class, and the spot-check result.
