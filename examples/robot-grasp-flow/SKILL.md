---
name: robot-grasp-flow
description: Workflow for a ROS 2 perception-to-grasp stack on a pick-and-place arm. Ideas are tried in Gazebo or on recorded bags first, kept code is validated in simulation, and nothing moves the real arm without a safety checklist and an operator on site. Only use when the user invokes robot-grasp-flow by name.
compatibility: Requires Node.js 18+ for scripts/flow.mjs.
---

# robot-grasp-flow

Try ideas cheaply in simulation and on recorded data, rebuild what works in the real stack, prove it in simulation, then climb to the real arm under a safety checklist with an operator present. Simulation is fast and disposable; the real arm is slow and can hurt someone, so the only path to it runs through the hardware trial gate.

Read [principles.md](principles.md) once at the start of a task.

## How to run

This workflow runs on rails. `flow` below means `node .agents/skills/robot-grasp-flow/scripts/flow.mjs`; it holds the state of the run and refuses moves the graph does not allow. Run `flow status` whenever you are unsure where you are.

1. Match the request to one playbook below and run `flow start <playbook> --request "<one line>"`. Read the playbook file.
2. Do its steps in order. After each, run `flow step <n> --evidence "<what shows it>"`, or `--skip "<reason>"`. Never drop a step silently.
3. At a `[human-gate]` step, run `flow step <n>`, present what the user must decide, and end your turn. Only the user can pass the gate.
4. When every step is recorded, run `flow finish --evidence "<what proves Done when>"`. It runs the playbook's checks and lists the open exits.
5. Take the exit whose condition holds: `flow exit <to> --because "<why>"`. The next playbook starts; follow-ups stay in the current run.
6. To stop mid-playbook, run `flow pause --note "<handoff>"` first.
7. Report at the end of each playbook before following an exit.
8. Never run a command that moves the real arm outside [hardware-trial](playbooks/hardware-trial.md).

## Routing

| Request | Playbook |
|---|---|
| "Would X work?", a perception or planning idea to try | [spike](playbooks/spike.md) |
| A spike finished, deciding whether to build it | [decide](playbooks/decide.md) |
| New or changed behavior in the stack | [increment](playbooks/increment.md) |
| Collecting or labeling images for the detector | [dataset-curation](playbooks/dataset-curation.md) |
| Checking behavior in simulation before the real arm | [sim-validation](playbooks/sim-validation.md) |
| Running anything on the real arm | [hardware-trial](playbooks/hardware-trial.md) |
| A trialed change to merge and tag | [ship](playbooks/ship.md) |
| A reported defect | [bug-fix](playbooks/bug-fix.md) |
| A read-only question about the code, bags or logs | [investigation](playbooks/investigation.md) |
| Nothing above fits | Pick the closest playbook, say which and why, or ask one question |

## Phases

| Lifecycle | Means | Leaves through |
|---|---|---|
| throwaway | Spikes in `scratch/`, simulation and bags only | [decide](playbooks/decide.md) |
| tracer | Kept code, validated in simulation | [hardware-trial](playbooks/hardware-trial.md) |
| hardened | Trialed on the real arm | - |

See [graph.md](graph.md) for the full workflow graph and [profile.md](profile.md) for the choices behind it.
