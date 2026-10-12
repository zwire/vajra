# Facet: reproducibility

Others must be able to re-derive the result: analyses that inform decisions, research results, regulated records, reports, benchmarks.

## Present when

- A result will be questioned later, by a reviewer, auditor, stakeholder or your future self.
- The same inputs must give the same outputs on another machine.

## Pin down in the domain model

- The raw inputs and where they are kept immutable.
- The environment pin (lockfile, container, toolchain versions) and seeds.
- The single command that goes from raw inputs to the published result.

## Evidence

- A clean re-run from raw inputs that reproduces the published numbers, with the command and environment recorded.
- Provenance: which data version, code commit and parameters produced each result.

## Graph changes

- Promotion of an analysis or result requires a clean re-run (in the gate's checklist).
- Reports state method, data versions, and uncertainty.
- Exploratory notebooks stay throwaway; the kept result is a script or pipeline.

## Rails

- `checks`: the raw-to-result command, compared with the published numbers.
- `writes`: raw input directories are never writable.

## Questions

- Who will try to reproduce this, and when?
- What changes between runs today (data, environment, randomness)?
