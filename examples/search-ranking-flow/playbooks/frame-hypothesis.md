---
id: frame-hypothesis
title: Frame the hypothesis
phase: explore
lifecycle: throwaway
kind: work
writes: [experiments/**]
exits:
  - to: offline-experiment
    when: the hypothesis, metric and expected gain are written down
  - to: investigation
    when: the answer probably exists in past experiments or dashboards
---

# Frame the hypothesis

## Purpose

Turn an idea or a relevance complaint into one testable ranking hypothesis.

## Steps

1. Collect five to ten real queries that show the problem from `logs/clicks/` or the complaint.
2. Write the hypothesis in `experiments/<name>/README.md`: "Changing ⟨signal⟩ will raise NDCG@10 on ⟨query segment⟩ by at least 0.003 because ⟨reason⟩."
3. Check `experiments/` and `docs/decisions/` for earlier attempts at the same signal.
4. Name the feature or model change and the data it needs from the current snapshot.

## Done when

- `experiments/<name>/README.md` holds the queries, the hypothesis with a numeric expected gain, and links to earlier attempts.

## Reply with

- The hypothesis and the queries behind it.
