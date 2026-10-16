---
unit-tests: command that runs the host unit tests from the build tree, printing failures and exiting non-zero on any failure
static-analysis: command that runs the static analyzers over the sources and exits non-zero on a finding
integration-tests: command that runs the integration suite against the pump simulator
bench-tests: command that runs the system tests on the shared bench pump
trace-matrix: path of the trace matrix that links SRS items, design elements, tests and results
trace-check-design: command that fails unless every SRS id maps to a design element and a planned test in the trace matrix
trace-check-results: command that fails unless every SRS id has a passing result or a recorded deviation in the trace matrix
verification-report: path of the verification report produced from the test results (SRS → test → result → evidence)
risk-file: location of the ISO 14971 risk management file
baseline: command that baselines a controlled document in the document control system; takes the document kind (e.g. SRS) as its argument
release: command that builds the signed release and archives it in the document system
release-archive: location where an archived release build and its checksum land, per version
review-rule: review a merge request needs before it is merged
---

# Bindings

Every value that changes from one repository to the next is a binding: commands, paths and globs, URLs, branch names, project keys, dashboards, thresholds of one service. Playbooks, the router and the principles write `${name}`; each project gives the value in `.flow/medical-v-model-flow/project.md`. The skill itself names no repository, so it can be copied into any project of this kind.

A value is a string, or a list `[a, b]` (several globs or commands). The runtime fills the values in when it runs checks, guards commands and limits edits, and `flow status` shows them for the active playbook.
