# Composition: from profile to graph

Apply these rules in order. Each rule names the profile values it reads. Blueprint ids refer to files in [blueprints/](blueprints/README.md).

## 1. Choose the spine

The spine is the main path a typical request travels. Pick the first row that matches.

| Condition | Spine | Blueprints, in order |
|---|---|---|
| `uncertainty: chaotic` | Stabilize | `stabilize` → `investigation` → (normal spine for the follow-up) |
| `requirements: unknown` or `uncertainty: complex` | Discovery | `frame-the-question` → `spike` or `prototype` or `poc` → `decide` (gate) → next phase |
| `cadence: phase-gated` or (`requirements: fixed` and `failure_cost: regulated`) | Plan-driven | `requirements` → `design` (with paired test plan) → `build-to-spec` → `verify-against-spec` → `release-gate` |
| `cadence: timeboxed` | Sprint | `sprint-planning` → `increment` → `sprint-review` → `retro` |
| otherwise | Flow | `slice` → `increment` → `ship` |

When `journey` has more than one phase, chain spines: the Discovery spine for `explore`, then the cadence spine (Sprint, Flow or Plan-driven) for `expand` and `extract`, joined by promotion gates (rule 4).

## 2. Add service playbooks

Service playbooks are entered from the router directly, independent of the spine. Add one only when its condition holds.

| Blueprint | Add when |
|---|---|
| `investigation` | Always (read-only questions are universal) |
| `bug-fix` | `journey` includes `expand` or `extract`, or `artifact_lifetime` is not `disposable` |
| `refactor` | `artifact_lifetime: long-lived`, or `journey` includes `extract` |
| `qa-exploratory` | `failure_cost` is `customer` or `regulated`, or the user mentioned QA |
| `regression-suite` | `failure_cost` is `customer` or `regulated` and `verification` is not `evidence` |
| `harden` | `journey` contains `explore` and a later phase |
| `production-readiness` | `journey` includes `extract` and `failure_cost` is `customer` or `regulated` |
| `incident` | `production-readiness` is present |
| `retro` | `cadence: timeboxed`, or `journey` has more than one phase (retro is where phase shifts get noticed) |
| `pause-and-resume` | `autonomy: high`, or work spans many sessions |

## 3. Apply the domain model

Build the [domain model](domain-model.md) first: areas, their [facets](facets/README.md), evidence ladders, irreversible actions with exact commands, lead times, tools and vocabulary. Then, for each present facet:

1. Apply its graph changes: rewrite the selected blueprints' steps and "Done when" with the area's real evidence, and add the playbooks the facet calls for, named in the user's terms (`sim-validation`, `backfill`, `playtest`, not `facet-playbook`).
2. Collect its irreversible actions with their exact commands; rule 4 gates them and rule 6 guards them.
3. Collect its rails (checks, protected paths); rule 6 installs them.

With several facets or areas, take the strictest gate defaults, the union of irreversible actions, and merge playbooks that do the same job. `physical-world` safety rules win over every other facet and over `autonomy`.

When hardware revisions are involved, model two speeds: a phase-gated hardware spine (revisions, bring-up, certification) and a fast software loop that runs against simulators, dev boards or test rigs between hardware gates.

Then apply the [specificity rules](domain-model.md#specificity-rules) to every playbook you selected. A playbook that would read the same in another domain is not finished.

## 4. Add gates

Gates are playbooks with `kind: gate`. Only a gate that declares `promotes: from->to` may raise a lifecycle. Facets often call for a domain-specific gate at a boundary (a hardware trial for `physical-world`, an external checklist for `external-release`, a held-out evaluation for `data-dependence`); use it in place of the generic gate, named in the domain's terms, with the same `promotes`.

**Promotion gates**, one per lifecycle boundary the journey crosses:

| Boundary | Blueprint | `promotes` | Present when |
|---|---|---|---|
| `throwaway` → `tracer` | `decide` | `throwaway->tracer` | `journey` has `explore` and a later phase |
| `tracer` → `hardened` | `promote-to-production` | `tracer->hardened` | `journey` includes `extract` |

The validator warns when the profile's journey calls for a promotion gate the graph lacks.

If `artifact_lifetime: disposable` for exploration, `decide` exits to a fresh `tracer-bullet` (rebuild, never copy) rather than into hardening the spike's code.

**Human gates**: mark every irreversible step `[irreversible]` and put a `[human-gate]` step before it in the same playbook. Irreversible means: production deploys, data migrations, deleting data or branches others use, sending messages outside the project, spending money, publishing packages, plus every irreversible action in the domain model (moving real hardware, flashing firmware, backfills, store submissions, evaluating on a held-out set). Nothing else gets a human gate unless `autonomy: low`.

**Gate strictness** by `failure_cost`:

| `failure_cost` | Promotion evidence required | Human gate | Review |
|---|---|---|---|
| `throwaway` | Answer + reasoning | Only before irreversible steps | None |
| `internal` | Answer + reproducible demo | Only before irreversible steps | Self-review checklist |
| `customer` | Tests green + checklist with evidence links | Before deploy and migrations | Independent review (another agent context or a person) |
| `regulated` | Traceability from requirement to test to result; signed checklist | Before every promotion and release | Independent review + named human approver |

## 5. Set parameters

Write these into each playbook's steps, using `toolchain` commands and `vocabulary` words.

**Timeboxes** (exploration playbooks) by `uncertainty`:

| `uncertainty` | `frame-the-question` | `spike` / `prototype` | `poc` |
|---|---|---|---|
| `complicated` | skip | 1 session | 1–2 days |
| `complex` | 1 session | 1–3 sessions | 2–5 days |
| `chaotic` | after `stabilize` | 1 session | not applicable |

**Verification posture** by `verification`:

- `evidence`: each playbook's "Done when" demands observed output (command output, screenshot, log line) from the real artifact.
- `test-after`: add a "write or update tests that pin the new behavior" step before "Done when".
- `tdd`: the first build step writes a failing test; "Done when" requires red-then-green evidence.
- `formal`: add a step for model checking or proof of the stated invariants on the riskiest component, plus `tdd` rules.

Exploration playbooks (`lifecycle: throwaway`) always use `evidence`, whatever the axis says. Tests on throwaway code slow learning.

**Discipline ratchet**: verification depth may only increase along the spine. Never lower it after a promotion gate.

**Parallelism** by `parallelism`:

- `none`: no fan-out steps.
- `explore-only`: `prototype`, `spike` and `qa-exploratory` may run N variants or charters in parallel, then compare in one context.
- `wherever-splittable`: also independent increments and review panels. Never fan out a sequential chain (each step needs the previous result): split work wins on splittable tasks and loses on sequential ones.

Use the diamond shape for fan-out: split → parallel workers → verify in a separate context → merge under one owner.

**Autonomy checkpoints** by `autonomy`:

- `high`: stop only at gates. Use the pause-and-resume playbook for long runs.
- `medium`: also report at the end of each playbook before following an exit.
- `low`: also confirm the plan before the first build step of each playbook.

## 6. Lay the rails

The generated skill runs on `scripts/flow.mjs` (copied from this skill). The runtime enforces what the frontmatter declares, so declare everything the profile and domain model call for. Prose a playbook asks the agent to remember is a rail only if it is also in the frontmatter.

**Rails level** (`rails` axis), from the profile:

| Condition | `rails` |
|---|---|
| `failure_cost: regulated`, or `physical-world` with people nearby, or `autonomy: high` | `strict`: code edits need an active playbook |
| Any `[irreversible]` step, or `failure_cost` `internal` or `customer` | `standard`: guarded commands, human-only approvals, write limits, stop nudges |
| `failure_cost: throwaway` and no irreversible step | `advisory`: state is tracked and injected; nothing is blocked |

**Per playbook**:

- `checks`: the commands that prove "Done when" mechanically, from the toolchain and domain model (test suite, reconciliation query, benchmark with threshold, reference diff). Every kept-code work playbook gets them when `verification` is not `evidence`. Exits that handle failure get `on: fail`, the others `on: pass`, so a red check routes the run instead of being argued away.
- `writes`: the paths the playbook may edit. Throwaway playbooks get their scratch path only; playbooks that must not touch datasets, raw inputs or generated contracts leave those out.
- `irreversible`: the exact commands of its `[irreversible]` steps (substring, or `/regex/`). The hooks block them everywhere else, and here until the human gate is approved. An irreversible step without a guarded command is a gap the validator reports.

The router's "How to run" section drives every run through `flow.mjs` (see [../templates/router.md](../templates/router.md)).

## 7. Prune

- Remove any playbook no route or exit reaches.
- Merge two playbooks that always run back to back with no decision between them.
- Remove gates that guard nothing irreversible and no lifecycle change.
- Remove steps that restate a principle; reference the principle instead.
- Target 5–12 playbooks. More than 15 means the profile is trying to serve two styles: split it into two skills.

## Archetype presets

Use as the starting profile when the declaration resembles one; then override with stated and inferred values. Archetypes set style axes and likely facets only; the domain model is always built for the user.

| Archetype | Declaration sounds like | Key values | Typical graph |
|---|---|---|---|
| Explorer | "I'm poking at ideas" | `complex`, `unknown`, journey `[explore]`, `throwaway`, `disposable`, `evidence` | frame-the-question → spike / prototype → decide → end; investigation |
| PoC sprint | "Prove it works for the demo" | `complicated`, journey `[explore]`, `internal`, success criteria | poc → decide → demo-handoff; investigation |
| Explore-to-production | "Find what works, then make it solid" | `complex`, `unknown`, journey `[explore, expand, extract]`, `customer`, `evolving` | frame → spike/prototype → decide → tracer-bullet → increment → harden → promote-to-production → ship; bug-fix, investigation, retro |
| Startup MVP | "Ship fast, learn from users" | `complex`, `shifting`, journey `[explore, expand]`, `internal`→`customer`, `continuous` | mvp-experiment → decide → slice → increment → ship; bug-fix |
| Scrum team | "Two-week sprints, PO, DoD" | `complicated`, `shifting`, `timeboxed`, `small`, `test-after` | sprint-planning → increment → sprint-review → retro; bug-fix, refactor, qa-exploratory |
| Kanban maintenance | "Tickets as they come" | `clear`, `continuous`, `long-lived`, `customer` | slice → increment → ship; bug-fix, refactor, incident |
| Production launch | "Launching to real customers, quality first" | `complicated`, journey `[extract]`, `customer`, `tdd` | increment → harden → production-readiness → promote-to-production → ship; incident, regression-suite |
| Regulated V-model | "Spec, traceability, sign-off" | `clear`, `fixed`, `phase-gated`, `regulated`, `formal` | requirements → design → build-to-spec → verify-against-spec → release-gate; bug-fix, incident |
| Data analysis | "Dig into the data and report findings" | `complex`, journey `[explore]`, facets `[data-dependence, reproducibility]` | frame-the-question → data-profiling → spike (notebook) → decide → analysis-report; investigation |
| ML research to product | "Find a model that beats the baseline, then ship it" | `complex`, journey `[explore, expand, extract]`, facets `[measured-outcome, data-dependence]` | frame-the-question → benchmark-harness → experiment-sweep → decide → tracer-bullet → harden → promote-to-production → ship |
| Indie game | "Find the fun, then build it out" | `complex`, journey `[explore, expand, extract]`, facets `[perceptual-output, resource-budgets, external-release]` | frame-the-question → prototype → playtest → decide → tracer-bullet (vertical slice) → increment → platform-certification |
| Robot stack | "Perception to motion on our robot" | `complicated`, `hardware: attached`, facets `[physical-world, stand-in-ladder, data-dependence]` | spike (sim) → decide → increment → sim-validation → hardware-trial → ship; dataset-curation, bug-fix |
| Hardware product | "Firmware for our own board" | `hardware: custom-hardware`, facets `[physical-world, stand-in-ladder, external-release]`, `phase-gated` hardware + `continuous` firmware | board-bring-up → increment → hil-test → harden → firmware-release; bug-fix, investigation |
| QA-led | "QA owns the release" | `complicated`, `customer`, dedicated QA | increment → qa-exploratory → regression-suite → release-gate; bug-fix |
