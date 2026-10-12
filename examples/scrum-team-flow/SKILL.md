---
name: scrum-team-flow
description: Sprint workflow for a five-person team shipping a B2B invoicing SaaS with a public REST API. Two-week sprints from a PO-owned backlog, GitHub pull requests, and nothing reaches customers without QA sign-off. Use for planning a sprint, building a backlog item, changing the public API, reviewing a sprint, preparing a release, fixing a reported defect, refactoring, or answering questions about the codebase, or when the user names scrum-team-flow.
compatibility: Requires Node.js 18+ for scripts/flow.mjs.
---

# scrum-team-flow

Work in two-week sprints. The PO owns the backlog and the sprint goal; developers turn committed stories into reviewed, tested increments; QA owns the decision to release. Customers are on SLAs and their ERPs call the public API, so API changes go expand-then-contract and nothing reaches production without QA sign-off.

Read [principles.md](principles.md) once at the start of a task.

## How to run

This workflow runs on rails. `flow` below means `node .agents/skills/scrum-team-flow/scripts/flow.mjs`; it holds the state of the run and refuses moves the graph does not allow. Run `flow status` whenever you are unsure where you are.

1. Match the request to one playbook below and run `flow start <playbook> --request "<one line>"`. Read the playbook file.
2. Do its steps in order. After each, run `flow step <n> --evidence "<what shows it>"`, or `--skip "<reason>"`. Never drop a step silently.
3. At a `[human-gate]` step, run `flow step <n>`, present what the user must decide, and end your turn. Only the user can pass the gate.
4. When every step is recorded, run `flow finish --evidence "<what proves Done when>"`. It runs the playbook's checks and lists the open exits.
5. Take the exit whose condition holds: `flow exit <to> --because "<why>"`. The next playbook starts; follow-ups stay in the current run.
6. To stop mid-playbook, run `flow pause --note "<handoff>"` first.
7. Report at the end of each playbook before following an exit.

## Routing

| Request | Playbook |
|---|---|
| Start of a sprint, "what do we take on?" | [sprint-planning](playbooks/sprint-planning.md) |
| A committed story to build or change | [increment](playbooks/increment.md) |
| A story that changes the public REST API | [api-change](playbooks/api-change.md) |
| End of a sprint, demo for the PO | [sprint-review](playbooks/sprint-review.md) |
| Testing a release candidate beyond the scripted suite | [qa-exploratory](playbooks/qa-exploratory.md) |
| "Can we release?", preparing a release | [release-gate](playbooks/release-gate.md) |
| A reported defect | [bug-fix](playbooks/bug-fix.md) |
| Restructuring code without changing behavior | [refactor](playbooks/refactor.md) |
| A read-only question about the code | [investigation](playbooks/investigation.md) |
| After the sprint review, "what do we change?" | [retro](playbooks/retro.md) |
| Nothing above fits | Pick the closest playbook, say which and why, or ask one question |

## Phases

| Lifecycle | Means | Leaves through |
|---|---|---|
| tracer | Merged to `main`, not yet released | [release-gate](playbooks/release-gate.md) |
| hardened | Released to customers | - |

See [graph.md](graph.md) for the full workflow graph and [profile.md](profile.md) for the choices behind it.
