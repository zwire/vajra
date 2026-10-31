---
name: medical-v-model-flow
description: Plan-driven V-model workflow for medical device software (IEC 62304 class B) with fixed requirements per release, requirement-to-test traceability, and a named QA lead signing off releases. Only use when the user invokes medical-v-model-flow by name.
compatibility: Requires Node.js 18+ for scripts/flow.mjs.
---

# medical-v-model-flow

Requirements are fixed per release and every change must be traceable from requirement to design to test to result. Design and its tests are written together; code is built test-first against the plan; nothing is released without a verification report and a named approver. A requirement change goes through impact analysis before anything else moves.

Read [principles.md](principles.md) once at the start of a task.

## How to run

This workflow runs on rails. `flow` below means `node scripts/flow.mjs` from this skill's directory, run with the project root as the working directory; it holds the state of the run and refuses moves the graph does not allow. Run `flow status` whenever you are unsure where you are.

A `${...}` in a playbook is a project binding: a command, path or other value this repository sets in `.flow/medical-v-model-flow/project.md`. `flow status` shows the values the active playbook uses. If `flow` says a binding is unbound, ask the user to fill it in; never guess a value.

1. Match the request to one playbook below and run `flow start <playbook> --request "<one line>"`. Read the playbook file.
2. Do its steps in order. After each, run `flow step <n> --evidence "<what shows it>"`, or `--skip "<reason>"`. Never drop a step silently.
3. At a `[human-gate]` step, run `flow step <n>`, present what the user must decide, put Approve / Reject to them with your choice dialog or buttons (in plain words only if you have none), and end your turn. When they answer, however they put it, record it with `flow answer approve` or `flow answer reject --note "<why>"` without asking again. Only the user can pass the gate.
4. When every step is recorded, run `flow finish --evidence "<what proves Done when>"`. It runs the playbook's checks and lists the open exits.
5. Take the exit whose condition holds: `flow exit <to> --because "<why>"`. The next playbook starts; follow-ups stay in the current run.
6. To stop mid-playbook, run `flow pause --note "<handoff>"` first.
7. Before the first build step of each playbook, present your plan and wait for confirmation.

## Routing

| Request | Playbook |
|---|---|
| A new release scope, new or clarified requirements | [requirements](playbooks/requirements.md) |
| Architecture, interfaces, or test planning for baselined requirements | [design](playbooks/design.md) |
| Implementing a designed element | [build-to-spec](playbooks/build-to-spec.md) |
| Verifying the build against the requirements | [verify-against-spec](playbooks/verify-against-spec.md) |
| "Can we release?" | [release-gate](playbooks/release-gate.md) |
| Changing a baselined requirement | [change-request](playbooks/change-request.md) |
| A problem report from testing or the field | [problem-report](playbooks/problem-report.md) |
| A read-only question about the code or the records | [investigation](playbooks/investigation.md) |
| Nothing above fits | Pick the closest playbook, say which and why, or ask one question |

## Phases

| Lifecycle | Means | Leaves through |
|---|---|---|
| tracer | Built and under verification | [release-gate](playbooks/release-gate.md) |
| hardened | Released in a device | - |

See [graph.md](graph.md) for the full workflow graph and [profile.md](profile.md) for the choices behind it.
