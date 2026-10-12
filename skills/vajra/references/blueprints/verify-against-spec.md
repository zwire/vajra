---
id: verify-against-spec
title: Verify against spec
phase: extract
lifecycle: tracer
kind: work
exits:
  - to: release-gate
    when: every REQ id has a result or a recorded deviation
---

# Verify against spec

## Purpose

Verify the built system against every requirement.

## Steps

1. Run the full test suite and acceptance tests; collect results per REQ id.
2. Run non-functional checks (performance, security, accessibility) named in requirements.
3. Produce the verification report: REQ → test → result → evidence.

## Done when

- Every REQ id has a passing result or a recorded deviation.
