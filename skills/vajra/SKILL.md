---
name: vajra
description: Meta skill creator that turns a developer's stated way of working and problem domain into a custom workflow skill (a router entry point plus per-use-case playbooks connected by phase transitions and quality gates). Only use when the user explicitly invokes vajra by name (for example /vajra); never trigger automatically.
license: MIT
compatibility: Requires Node.js 18+ for scripts/validate.mjs, scripts/flow.mjs, scripts/guard.mjs and scripts/interview.mjs. Works with any agent that loads Agent Skills.
metadata:
  version: "0.3.0"
---

# vajra

Generate a workflow skill tailored to how one developer or team wants to work and to the domain they work in. The output has the shape of a routed playbook skill (a thin router `SKILL.md`, a `playbooks/` directory, principles, and a rendered graph), but every node, gate and transition is derived from the user's declared style and domain instead of someone else's habits.

**Explicit invocation only.** Run this skill only when the user invoked it by name. If you notice a request that might benefit from it, you may mention that `/vajra` exists; do not start it.

A generated skill is a **workflow graph**:

- **Nodes** are playbooks: a named sequence of steps with its own proof requirement.
- **Edges** are exits: "when this condition holds, continue in that playbook".
- **Gates** are playbooks that control promotion between lifecycles (`throwaway` → `tracer` → `hardened`) or put a human in front of an irreversible step.
- **The router** matches an incoming request to an entry playbook.

Two inputs shape it: the **development style** (how uncertain the work is, how it is paced, what failure costs) decides the topology; the **domain model**, built for this user at the resolution their work needs, decides what each playbook's work and evidence actually are.

The output is **reusable**: it names no repository. Commands, paths, URLs and every other value that differs between repositories are **bindings** (`${name}`), declared in the skill's `bindings.md` and given values per project in `.flow/<skill>/project.md`. The same skill can be copied into any project of the same kind; only the project file changes.

The output runs **on rails**: every generated skill carries `scripts/flow.mjs`, a runtime that tracks the current playbook, refuses moves the graph does not allow, runs each playbook's checks, and interrupts at human gates until the human resumes it. It depends on no particular agent: it is a CLI, an MCP server, and a lifecycle hook for any agent that supports hooks.

## Choose the mode

| Request | Mode | Read |
|---|---|---|
| Create a new workflow skill | Generate | [workflows/generate.md](workflows/generate.md) |
| Get advice on what workflow is needed, without generating yet | Consult | [workflows/consult.md](workflows/consult.md) |
| Change an existing generated skill (retro findings, new phase, too heavy or too light) | Evolve | [workflows/evolve.md](workflows/evolve.md) |
| Explain, visualize or check an existing generated skill | Inspect | [workflows/inspect.md](workflows/inspect.md) |

When unclear, default to **Generate** if no generated skill exists in the project, otherwise **Evolve**. Generate and Evolve both run a Consult session inside them.

## Operating rules

1. **Shortest path first.** Every playbook, step and gate in the output must be justified by the profile. Remove anything the profile does not need. A generated skill usually has 5–12 playbooks.
2. **Infer first, then grill.** Infer what you can from the user's words, the repository and the toolchain. Then question the user in short rounds of choices, each pre-set to your recommendation, until every graph-changing decision is settled or the user says to proceed. Use the agent's own question tool, a one-page form, or plain text, whichever is lightest ([workflows/consult.md](workflows/consult.md#answer-surfaces)).
3. **Gates where mistakes are expensive.** Put human gates in front of irreversible actions and promotion gates between lifecycles. Do not put gates anywhere else.
4. **Topology follows the shape of the work.** Fan out only when the work splits into independent parts; keep sequential work sequential.
5. **Fit the domain, never stop at the general case.** Build the domain model from the repository and the interview; use the facets as a checklist, not a template. Every step and "Done when" names the real tools, metrics and artifacts of this domain, and the real commands and paths through bindings. Physical safety rules win.
6. **Reusable, never tied to one repository.** The skill holds the way of working and the domain; the project file holds this repository's values. No path, command, URL, branch name, project key or service threshold is written into the skill: write `${name}`, declare it in `bindings.md`, and put the value in `.flow/<skill>/project.md`. The validator rejects literal rails values and warns on repository paths in prose.
7. **Rails over reminders.** Anything the graph depends on (exits, human gates, checks, irreversible commands, write limits) goes into frontmatter the runtime enforces, not only into prose.
8. **Validate before handing over.** Run `scripts/validate.mjs` on the generated skill (with `--project` for the project it was made in) and fix every error. Never hand over a skill that fails validation.
9. **Write for the agent that will run it.** Generated files are operational instructions in English: imperative, concrete, no filler.

## Reference map

Read only what the current step needs.

| File | Contains |
|---|---|
| [references/style-profile.md](references/style-profile.md) | Profile axes, inference cues, question bank, profile format |
| [references/composition.md](references/composition.md) | Rules that turn a profile into a graph: spine, services, domain model, gates, parameters, rails, pruning, archetype presets |
| [references/blueprints/](references/blueprints/README.md) | Core playbook blueprints, one file each in the playbook contract (spike, PoC, tracer bullet, increment, hardening, production readiness, QA, and more) |
| [references/domain-model.md](references/domain-model.md) | Building the domain model at the right resolution; specificity rules against generic output |
| [references/facets/](references/facets/README.md) | Cross-cutting domain traits (measured outcome, perceptual output, data dependence, stand-in ladder, physical world, shared contracts, data mutation, external release, resource budgets, reproducibility) |
| [references/gates-and-lifecycles.md](references/gates-and-lifecycles.md) | Lifecycle labels, promotion gates, the discipline ratchet, human gates |
| [references/graph-model.md](references/graph-model.md) | Node and edge semantics, topology rules, the playbook, profile and bindings contracts the validator enforces, schema versions and migrations |
| [references/authoring.md](references/authoring.md) | How to write the generated router and playbooks so agents follow them |
| [templates/](templates/) | `router.md`, `playbook.md`, `principles.md`, `profile.md`, `bindings.md` skeletons, `project.md` for the project's values, and `interview-round.json`, the question-round spec |
| [scripts/validate.mjs](scripts/validate.mjs) | Validator and graph renderer: `node scripts/validate.mjs <skill-dir> [--project <root>] --write-graph` |
| [scripts/interview.mjs](scripts/interview.mjs) | Renders a consult round as chat text, a one-page form, or a local form that returns the answers as JSON |
| [scripts/flow.mjs](scripts/flow.mjs) | Runtime copied into every generated skill: run state, transitions, checks; CLI, MCP server and lifecycle hooks |
| [scripts/guard.mjs](scripts/guard.mjs) | Part of the runtime: reads the agent's shell lines and edits for the hooks, and decides what touches the run state or the rails |
| [references/rails.md](references/rails.md) | What the runtime enforces, the standards it follows, how to install it per agent, and the limits of enforcement |
| [references/calibration.md](references/calibration.md) | Worked excerpts showing how concrete a domain model, a playbook and its rails should be |
