# Style profile

The style profile is the normalized form of "how I want to work". Composition rules read only the profile, so two users who say different words but have the same profile get the same graph.

## Axes

| Axis | Values | What it decides |
|---|---|---|
| `uncertainty` | `clear` · `complicated` · `complex` · `chaotic` | The spine. Clear and complicated: analyze, then build. Complex: probe, sense, respond. Chaotic: act to stabilize first. (Cynefin) |
| `requirements` | `fixed` · `shifting` · `unknown` | Plan-driven vs iterative vs discovery spine |
| `journey` | list of phases from `explore`, `expand`, `extract` | Which lifecycles exist and which promotion gates are needed. `[explore]` alone means no hardening; `[explore, expand, extract]` means the full bridge. (Kent Beck's 3X) |
| `failure_cost` | `throwaway` · `internal` · `customer` · `regulated` | Gate strictness, verification depth, human approvals |
| `artifact_lifetime` | `disposable` · `evolving` · `long-lived` | Whether code from exploration may be kept (tracer bullet) or must be discarded (spike) |
| `cadence` | `continuous` · `timeboxed` · `phase-gated` | Flow (kanban), sprints (scrum), or stage gates (waterfall, V-model) |
| `team` | `solo` · `small` · `multi-team` | Roles in playbooks, review requirements, handoffs |
| `verification` | `evidence` · `test-after` · `tdd` · `formal` | Default proof style for playbooks |
| `autonomy` | `high` · `medium` · `low` | How often the agent stops to check with the human outside of gates |
| `parallelism` | `none` · `explore-only` · `wherever-splittable` | Where fan-out (multiple agents or attempts) is allowed |
| `domains` | free-form labels in the user's words (`grasp-planning`, `search-ranking`) | Names only; the [domain model](domain-model.md) in the profile body holds the substance |
| `facets` | `measured-outcome` · `perceptual-output` · `data-dependence` · `stand-in-ladder` · `physical-world` · `shared-contracts` · `data-mutation` · `external-release` · `resource-budgets` · `reproducibility` | Evidence, extra playbooks, gates, irreversible actions and rails ([facets/](facets/README.md)) |
| `hardware` | `none` · `simulated` · `attached` · `custom-hardware` | Anything above `none` implies the `physical-world` facet, whose safety rules win |
| `invocation` | `explicit` · `auto` | Whether the generated skill's description tells agents to run it only when invoked by name, or to trigger on matching tasks. Default `explicit` |
| `rails` | `advisory` · `standard` · `strict` | How hard the runtime and hooks enforce the graph ([composition.md](composition.md#6-lay-the-rails)) |
| `toolchain` | free-form map | Concrete commands: VCS host, CI, test, lint, typecheck, deploy, issue tracker |
| `vocabulary` | free-form map | The user's own words for things ("ticket", "story", "experiment", "card") |

## Inference cues

Map phrases to values. Explicit statements override cues; record the cue as evidence.

| Phrase or signal | Inferred values |
|---|---|
| "poke at", "explore", "not sure what I want", "fuzzy idea", "research" | `uncertainty: complex`, `requirements: unknown`, `journey` starts with `explore` |
| "spike", "find out if", "is it possible to" | `artifact_lifetime: disposable` for the first phase |
| "PoC", "demo for the client", "proof of concept" | `journey: [explore]`, `failure_cost: internal`, success criteria required |
| "MVP", "validate with users", "product-market fit" | `journey: [explore, expand]`, hypothesis-driven playbooks |
| "harden later", "graduate to production", "turn into a real system" | `journey: [explore, expand, extract]`, `artifact_lifetime: evolving` |
| "sprint", "scrum", "backlog", "PO", "story points" | `cadence: timeboxed`, `requirements: shifting` |
| "kanban", "flow", "WIP", "tickets as they come" | `cadence: continuous` |
| "spec first", "requirements document", "sign-off", "waterfall", "V-model" | `cadence: phase-gated`, `requirements: fixed` |
| "regulated", "audit", "medical", "finance", "safety", "traceability" | `failure_cost: regulated`, `verification: formal` or `tdd` |
| "production", "SLO", "on-call", "paying customers", "launch" | `failure_cost: customer`, `journey` includes `extract` |
| "QA sign-off", "test plan", "exploratory testing" | dedicated QA playbooks, `verification: test-after` at least |
| "TDD", "red-green" | `verification: tdd` |
| "just me", "side project" | `team: solo` |
| "don't ask me", "run overnight", "autonomous" | `autonomy: high`, `rails: strict` |
| "check with me", "I want to review everything" | `autonomy: low` |
| Repository has no tests | `verification` defaults to `evidence` unless stated |
| CI config, deploy config, monitoring config present | `journey` likely includes `extract`; take commands from config |
| Multiple CODEOWNERS teams | `team: multi-team` |
| Domain words, tools and file types in the declaration or repository | Draft the domain model: areas, then facets per area (see each facet's "Present when") |
| Devices, boards, robots, sensors, motors, flashing | `hardware: attached` (or `custom-hardware` for own boards), facet `physical-world` |
| A simulator or emulator in the repository | `hardware: simulated` unless real hardware is also mentioned |

## Interview question bank

Used by the consult session ([../workflows/consult.md](../workflows/consult.md)), one question at a time, each with a recommended option. Ask only questions whose answer changes the graph. Examples:

1. **Where does this work usually start?** a) A clear spec · b) A rough goal I refine as I go *(recommended for most product work)* · c) A question I can't even phrase yet
2. **What happens to code written while exploring?** a) Always thrown away · b) The good parts grow into the real system *(recommended)* · c) It is the real system
3. **What does a mistake in production cost?** a) Nothing, it's a prototype · b) Some annoyed teammates · c) Customer impact · d) Regulatory or safety impact
4. **How is work paced?** a) Continuous flow · b) Fixed-length sprints · c) Phases with sign-offs
5. **How much should the agent stop to check with you?** a) Only at gates · b) At the end of each playbook · c) Before each significant step
6. **Where may the agent run several attempts in parallel?** a) Nowhere · b) Only when exploring alternatives · c) Anywhere the work splits cleanly
7. **What does convincing evidence look like in your work?** Draft it from the repository first and ask the user to correct it; this seeds the domain model.
8. **Does the software touch physical hardware?** a) No · b) Only through a simulator · c) Off-the-shelf devices · d) Our own boards or robots

## Profile format

Write the profile to `<generated-skill>/profile.md` using [../templates/profile.md](../templates/profile.md):

- **Frontmatter**: `schema`, `generator` and every axis value in machine-readable form ([graph-model.md](graph-model.md#profile-frontmatter)). The validator checks the values and compares them with the graph; evals read them.
- **Body**: the declaration verbatim, every axis value with its source (`stated`, `inferred: <evidence>`, `default`), the consult log, composition notes, and a `## History` section that Evolve appends to.

Keep frontmatter and table in sync; the frontmatter wins when they differ.
