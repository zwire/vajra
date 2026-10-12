# Gates and lifecycles

The part of a workflow most existing skills leave implicit: how work moves from "trying something" to "something people rely on" without either freezing exploration under process or letting prototype code leak into production.

## Lifecycle labels

Every artifact (and every playbook that produces one) carries a lifecycle label.

| Label | Meaning | Allowed shortcuts | Required discipline |
|---|---|---|---|
| `throwaway` | Exists to learn. Will be deleted. | Hard-coded values, no tests, no error handling, scratch location | Learning log; label it as throwaway; never imported by kept code |
| `tracer` | Kept and grown. Real architecture, thin behavior. | Missing features, basic error handling | Lives in the real codebase and pipeline; tests for every behavior it has |
| `hardened` | Others depend on it. | None without a recorded exception | Full verification for the profile's failure cost; observability; rollback |
| `any` | Playbook works on artifacts of any label (investigation, bug fix, ship) | Inherits the artifact's label | Inherits the artifact's label |

A playbook's label is the label of what it produces. Service playbooks use `any`.

## Promotion gates

Raising a label always goes through a gate playbook (`kind: gate`) that declares the raise in its frontmatter, for example `promotes: throwaway->tracer`. The validator rejects any path that raises a label without passing such a gate, including detours through `any` playbooks, and any path that reaches a gate below its `from` level (throwaway work cannot enter a `tracer->hardened` gate). A gate without `promotes` only puts a human in front of something; it raises nothing.

### throwaway → tracer (`decide`, `promotes: throwaway->tracer`)

Pass when all hold:

1. The exploration question has an answer backed by observed evidence.
2. The answer justifies building (value or feasibility shown).
3. A decision record exists: context, decision, consequences, shortcuts taken.
4. The first tracer slice is defined.

Then **rebuild, do not promote the code**. Write the tracer bullet in the real structure using what the spike taught. Copy individual pieces only when they already meet tracer discipline, and say so in the decision record. This is the main defense against prototype code becoming production by accident.

### tracer → hardened (`promote-to-production`, `release-gate`, `promotes: tracer->hardened`)

Pass when the checklist for the profile's `failure_cost` is complete with linked evidence:

| Item | internal | customer | regulated |
|---|---|---|---|
| Behavior tests green in CI | ✓ | ✓ | ✓ |
| Characterization tests for code that came from exploration | | ✓ | ✓ |
| Independent review (fresh agent context or a person) | | ✓ | ✓ |
| Observability: logs, metrics, alerts | | ✓ | ✓ |
| Rollback procedure tested | | ✓ | ✓ |
| Production readiness items (SLOs, capacity, failure modes, security, data) | | ✓ | ✓ |
| Traceability: requirement → test → result | | | ✓ |
| Named human approver recorded | | | ✓ |

## Moving backwards

The 3X model is fractal: a hardened system can grow a new unknown. When a problem inside a hardened system is genuinely unknown, open an `explore` loop for that sub-problem only (`frame-the-question` from `investigation` or `incident`). Its output re-enters through `decide` like any other exploration. Hardened code itself is never relabeled.

## The discipline ratchet

Verification depth, review depth and gate strictness only increase along a path. A playbook downstream of a promotion gate never has weaker "Done when" criteria than the gate demanded. When the user finds the flow too heavy, lower strictness by changing the profile's `failure_cost` (Evolve mode), not by skipping steps in a single run.

## Phase transition signals

The `retro` playbook checks for these signals and suggests Evolve when one appears.

| Transition | Signal |
|---|---|
| explore → expand | An experiment gets a response far above the norm (an order of magnitude); people use it without being asked; the same question stops changing |
| expand → extract | The drivers of growth or value are known and stable; work shifts from "what to build" to "keep it running and efficient" |
| any → explore (sub-problem) | A failure or request nobody can explain with current knowledge |

## Human gates

A human gate is a step tagged `[human-gate]` that stops the run until the user answers. Place one before every step tagged `[irreversible]`; the validator enforces this inside each playbook, and the runtime refuses the steps behind an unapproved gate and lets only the human approve it ([rails.md](rails.md#human-gates)).

Irreversible: production deploys, data migrations, deleting shared data or branches, messages or posts outside the project, spending money, publishing packages, changing access or permissions.

Do not add human gates elsewhere unless the profile sets `autonomy: low`. Each extra gate costs the user an interruption and teaches them to approve without reading.
