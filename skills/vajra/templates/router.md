---
name: {{name}}
description: {{one sentence on what this workflow is for, in the user's words}}. {{invocation explicit: "Only use when the user invokes NAME by name." / auto: "Use for WHICH TASKS, or when the user names NAME."}}
compatibility: Requires Node.js 18+ for scripts/flow.mjs.
---

# {{name}}

{{One paragraph: the way of working this skill encodes, taken from the profile declaration.}}

Read [principles.md](principles.md) once at the start of a task.

## How to run

This workflow runs on rails. `flow` below means `node scripts/flow.mjs` from this skill's directory, run with the project root as the working directory; it holds the state of the run and refuses moves the graph does not allow. Run `flow status` whenever you are unsure where you are.

A `${...}` in a playbook is a project binding: a command, path or other value this repository sets in `.flow/{{name}}/project.md`. `flow status` shows the values the active playbook uses. If `flow` says a binding is unbound, ask the user to fill it in; never guess a value.

1. Match the request to one playbook below and run `flow start <playbook> --request "<one line>"`. Read the playbook file.
2. Do its steps in order. After each, run `flow step <n> --evidence "<what shows it>"`, or `--skip "<reason>"`. Never drop a step silently.
3. At a `[human-gate]` step, run `flow step <n>`, present what the user must decide, put Approve / Reject to them with your choice dialog or buttons (in plain words only if you have none), and end your turn. When they answer, however they put it, record it with `flow answer approve` or `flow answer reject --note "<why>"` without asking again. Only the user can pass the gate.
4. When every step is recorded, run `flow finish --evidence "<what proves Done when>"`. It runs the playbook's checks and lists the open exits.
5. Take the exit whose condition holds: `flow exit <to> --because "<why>"`. The next playbook starts; follow-ups stay in the current run.
6. To stop mid-playbook, run `flow pause --note "<handoff>"` first.
{{autonomy-specific rule, e.g. "Report at the end of each playbook before taking an exit."}}

## Routing

| Request | Playbook |
|---|---|
| {{request type in the user's words}} | [{{id}}](playbooks/{{id}}.md) |
| Nothing above fits | Pick the closest playbook, say which and why, or ask one question |

## Phases

{{Omit this section when only one lifecycle exists.}}

| Lifecycle | Means | Leaves through |
|---|---|---|
| throwaway | Built to learn; deleted afterwards | [decide](playbooks/decide.md) |
| tracer | Kept and grown in the real codebase | [promote-to-production](playbooks/promote-to-production.md) |
| hardened | Others depend on it | - |

See [graph.md](graph.md) for the full workflow graph and [profile.md](profile.md) for the choices behind it.
