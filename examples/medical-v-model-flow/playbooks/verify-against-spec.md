---
id: verify-against-spec
title: Verify against spec
phase: extract
lifecycle: tracer
kind: work
checks:
  - scripts/run-system-tests.sh --target simulator
  - scripts/trace-check.py --require-results
exits:
  - to: release-gate
    when: every SRS id has a passing result or an accepted deviation
    on: pass
  - to: problem-report
    when: a test failed or an SRS id has no result
    on: fail
---

# Verify against spec

## Purpose

Verify the integrated software against every requirement.

## Steps

1. Run `ctest --test-dir build` and the integration suite with `scripts/run-system-tests.sh --target simulator`.
2. Run the system tests on the bench pump with `scripts/run-system-tests.sh --target bench`; collect results per SRS id.
3. Run the occlusion-detection timing and dose-accuracy checks the SRS names.
4. Produce `build/verification-report.pdf`: SRS → test → result → evidence.

## Done when

- `scripts/trace-check.py --require-results` shows a passing result or a recorded deviation with its risk assessment for every SRS id, and `build/verification-report.pdf` exists.

## Reply with

- The verification report and any failures.
