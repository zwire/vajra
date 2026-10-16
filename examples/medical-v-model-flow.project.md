---
# Values of medical-v-model-flow's bindings for this repository. Lives at .flow/medical-v-model-flow/project.md.
# One line per name in the skill's bindings.md: a string, or a list [a, b].
unit-tests: ctest --test-dir build --output-on-failure
static-analysis: scripts/static-analysis.sh
integration-tests: scripts/run-system-tests.sh --target simulator
bench-tests: scripts/run-system-tests.sh --target bench
trace-matrix: docs/trace.csv
trace-check-design: scripts/trace-check.py --require-design
trace-check-results: scripts/trace-check.py --require-results
verification-report: build/verification-report.pdf
risk-file: docs/risk/
baseline: scripts/baseline.sh
release: scripts/release.sh
release-archive: release/<version>/
review-rule: two approving reviews
---

# Project notes

Facts about this repository the workflow relies on. They stay here, not in the skill, so the skill stays reusable.

## Toolchain

| Purpose | Command or tool |
|---|---|
| Test | `ctest --test-dir build --output-on-failure` |
| Static analysis | `scripts/static-analysis.sh` (clang-tidy, cppcheck) |
| System tests | `scripts/run-system-tests.sh --target simulator\|bench` |
| Trace check | `scripts/trace-check.py` (`--require-design`, `--require-results`) |
| VCS host / review | GitLab merge requests, two reviewers |
| Baseline | `scripts/baseline.sh <document>` (document control system) |
| Release | `scripts/release.sh` (signed build, archived to the document system) |
| Trace matrix | `docs/trace.csv` |

## Where things live

- Trace matrix: `docs/trace.csv`; checked by `scripts/trace-check.py`.
- ISO 14971 risk file: `docs/risk/`.
- Verification report: `build/verification-report.pdf`, produced in verify-against-spec.
- Archived releases: `release/<version>/`, written by `scripts/release.sh` with the build's SHA-256.
- Integration tests run on the pump simulator (`--target simulator`); system tests on the bench pump (`--target bench`), which is shared with the hardware team and booked a day ahead.
- Document control approval of a baseline takes two days.
- Feasibility work happens in the research repository, not here.
