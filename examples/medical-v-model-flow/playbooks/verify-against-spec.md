---
id: verify-against-spec
title: Verify against spec
phase: extract
lifecycle: tracer
kind: work
checks:
  - ${integration-tests}
  - ${trace-check-results}
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

1. Run `${unit-tests}` and the integration suite on the pump simulator with `${integration-tests}`.
2. Run the system tests on the bench pump with `${bench-tests}`; collect results per SRS id.
3. Run the occlusion-detection timing and dose-accuracy checks the SRS names.
4. Produce `${verification-report}`: SRS → test → result → evidence.

## Done when

- `${trace-check-results}` shows a passing result or a recorded deviation with its risk assessment for every SRS id, and `${verification-report}` exists.

## Reply with

- The verification report and any failures.
