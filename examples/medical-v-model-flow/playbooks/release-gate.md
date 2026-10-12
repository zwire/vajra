---
id: release-gate
title: Release gate
phase: extract
lifecycle: any
kind: gate
promotes: tracer->hardened
checks:
  - scripts/trace-check.py --require-results
irreversible: [scripts/release.sh]
exits:
  - to: end
    when: the release is archived and the release record is signed
    on: pass
  - to: problem-report
    when: the approver said no-go
    on: pass
  - to: verify-against-spec
    when: the trace check failed
    on: fail
---

# Release gate

## Purpose

Go / no-go for releasing the software to manufacturing.

## Steps

1. Gather the verification report, open problem reports by risk class, and the trace matrix.
2. Check the release criteria: no open problem report above the accepted risk, every SRS id traced to a result.
3. [human-gate] Present the evidence and wait for the QA lead's signature; record the name and date.
4. [irreversible] Run `scripts/release.sh` to build the signed release and archive it.
5. Verify the archived build's checksum against the verified build.

## Done when

- `release/<version>/` holds the signed build whose SHA-256 matches the verified build, and the release record carries the QA lead's signature; or the no-go is recorded with its reasons.

## Reply with

- The verdict, the approver, the release id, and the checksum.
