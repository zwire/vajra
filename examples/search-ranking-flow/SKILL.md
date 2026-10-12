---
name: search-ranking-flow
description: Workflow for improving e-commerce product search ranking. Ideas start as offline experiments on click logs, promising ones are rebuilt in the ranker and serving path, validated on shadow traffic, and ramped through an A/B test with sign-off. Only use when the user invokes search-ranking-flow by name.
compatibility: Requires Node.js 18+ for scripts/flow.mjs.
---

# search-ranking-flow

Test ranking ideas cheaply offline against a frozen judgment set, rebuild only the winners in `ranker/` and `serving/`, prove them on shadow traffic within the latency budget, and let the A/B ramp decide. The held-out week is evaluated once, at the ramp gate, and every ramp stage waits for the product owner.

Read [principles.md](principles.md) once at the start of a task.

## How to run

This workflow runs on rails. `flow` below means `node .agents/skills/search-ranking-flow/scripts/flow.mjs`; it holds the state of the run and refuses moves the graph does not allow. Run `flow status` whenever you are unsure where you are.

1. Match the request to one playbook below and run `flow start <playbook> --request "<one line>"`. Read the playbook file.
2. Do its steps in order. After each, run `flow step <n> --evidence "<what shows it>"`, or `--skip "<reason>"`. Never drop a step silently.
3. At a `[human-gate]` step, run `flow step <n>`, present what the user must decide, and end your turn. Only the user can pass the gate.
4. When every step is recorded, run `flow finish --evidence "<what proves Done when>"`. It runs the playbook's checks and lists the open exits.
5. Take the exit whose condition holds: `flow exit <to> --because "<why>"`. The next playbook starts; follow-ups stay in the current run.
6. To stop mid-playbook, run `flow pause --note "<handoff>"` first.
7. Report at the end of each playbook before taking an exit.

## Routing

| Request | Playbook |
|---|---|
| A ranking idea, "would boosting X help?", a vague relevance complaint | [frame-hypothesis](playbooks/frame-hypothesis.md) |
| A concrete hypothesis to test offline | [offline-experiment](playbooks/offline-experiment.md) |
| An offline result to decide on | [decide](playbooks/decide.md) |
| Building a decided change into the ranker and serving path | [implement-ranker](playbooks/implement-ranker.md) |
| Checking a built ranker on shadow traffic | [shadow-validation](playbooks/shadow-validation.md) |
| Starting or widening an A/B test | [ab-ramp](playbooks/ab-ramp.md) |
| Refreshing the training snapshot or judgment set | [dataset-snapshot](playbooks/dataset-snapshot.md) |
| A reported ranking or serving defect | [bug-fix](playbooks/bug-fix.md) |
| A read-only question about logs, metrics or code | [investigation](playbooks/investigation.md) |
| After an A/B test concludes, "what did we learn?" | [retro](playbooks/retro.md) |
| Nothing above fits | Pick the closest playbook, say which and why, or ask one question |

## Phases

| Lifecycle | Means | Leaves through |
|---|---|---|
| throwaway | Offline experiments in `experiments/` | [decide](playbooks/decide.md) |
| tracer | Built in `ranker/` and `serving/`, shadow traffic only | [ab-ramp](playbooks/ab-ramp.md) |
| hardened | Serving real users | - |

See [graph.md](graph.md) for the full workflow graph and [profile.md](profile.md) for the choices behind it.
