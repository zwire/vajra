<div align="center">

# ⚡ vajra

**Generate your own workflow skill, and put your agent on rails.**

<sub>A <b>vajra</b> is the thunderbolt of Indian mythology, said to be as unbreakable as a diamond. Like a strike of lightning, vajra finds the shortest path through how you work in an instant; like a diamond, the rails it lays down do not bend.</sub>

A meta skill for AI coding agents. Describe how you work and what you build. It questions you until the plan is tight, then writes a **workflow graph** of playbooks, gates and exits fitted to your domain, plus a **runtime and lifecycle hooks** that enforce it in whichever agent you use. Your agent cannot skip a gate, take an exit the graph does not have, or run a deploy nobody approved.

[![CI](https://github.com/zwire/vajra/actions/workflows/ci.yml/badge.svg)](https://github.com/zwire/vajra/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](package.json)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Claude%20Code%20%C2%B7%20Codex%20%C2%B7%20Copilot-8A2BE2.svg)](https://github.com/vercel-labs/skills)
[![Rails: CLI + hooks](https://img.shields.io/badge/rails-CLI%20%2B%20hooks-D97757.svg)](skills/vajra/references/rails.md)
[![Hooks](https://img.shields.io/badge/hooks-Claude%20Code%20%C2%B7%20Codex%20%C2%B7%20Copilot-555.svg)](skills/vajra/references/rails.md#installing)

[Quick start](#quick-start) · [Usage](#usage) · [Why](#why) · [Rails](#rails-not-reminders) · [How it works](#how-it-works) · [Examples](#examples) · [Validator](#the-validator)

</div>

---

```mermaid
flowchart LR
  you(["“Offline experiments, then shadow traffic,<br/>then an A/B ramp. Revenue is on the line.”"])
  subgraph gen ["/vajra · once"]
    direction TB
    g1["Infer your profile<br/>and domain model"] --> g2["Grill you<br/>in quick rounds of choices"] --> g3["Compose the graph<br/>and its rails"] --> g4{{"Validate<br/>and dry-run"}}
  end
  subgraph flow ["/your-flow · every task"]
    direction TB
    f1["Router picks<br/>a playbook"] --> f2["Steps, checks,<br/>exits"] --> f3{{"Human gate<br/>before the irreversible"}}
  end
  subgraph rails ["Rails · every tool call"]
    direction TB
    r1["flow.mjs<br/>run state, legal moves"]
    r2["Hooks<br/>block, guard, inject"]
  end
  you --> gen --> flow
  flow <--> rails
  classDef gate fill:#ede9fe,stroke:#6d28d9,color:#000
  classDef rail fill:#fee2e2,stroke:#b91c1c,color:#000
  class g4,f3 gate
  class r1,r2 rail
```

## Quick start

Requires Node.js 18+ and Claude Code, Codex or GitHub Copilot. The generated skill is plain Agent Skills, so other agents can load it, but the hooks are installed and tested for these three.

**1. Install the skill**

```bash
npx skills add zwire/vajra        # add -g to install globally
```

**2. Generate your workflow.** In your agent, invoke vajra by name and describe how you work:

```
/vajra
Exploratory prototyping that can graduate to production. Solo, a Rails app on Heroku.
```

It reads your repository, asks you a few short rounds of multiple-choice questions, each pre-set to its recommendation (through your agent's question buttons, a one-page form, or plain text; reply "ok" or press Send to accept), then writes, validates and dry-runs a skill such as `.agents/skills/your-flow/`. Other declarations it handles:

- "Two-week sprints, PO-driven backlog, nothing ships without QA sign-off."
- "Robot perception stack with a camera. We have a simulator and one real arm."
- "Analysis notebooks that sometimes turn into nightly pipelines on BigQuery."

**3. Turn on the rails.** At the end it offers to install the hooks for the agents your project uses. You can also do it yourself:

```bash
node <your-flow>/scripts/flow.mjs install --harness claude,codex,copilot   # any subset
```

**4. Work.** Invoke your new skill by name with a task, for example `/your-flow add CSV export to invoices`. The agent picks the playbook and drives the run.

## Usage

### Day to day

| You want to | Do this |
|---|---|
| Start a task on the workflow | Invoke your skill by name with the task |
| Pass a human gate | When the agent stops at a gate, reply `approve` (optionally with a note) |
| Refuse a gate | Reply `reject <reason>`; the agent takes the exit that fits |
| See where the run is | `node <your-flow>/scripts/flow.mjs status` |
| See what happened | `node <your-flow>/scripts/flow.mjs log` |
| Approve from your terminal instead | `node <your-flow>/scripts/flow.mjs approve --by <you>` |
| Pause the hooks for a while | `flow.mjs suspend`, later `flow.mjs unsuspend` |

The agent's side (`flow start`, `step`, `finish`, `exit`) is written into your skill's `SKILL.md`, so you never type it. Your repository's commands and paths live in `.flow/your-flow/project.md`; commit it. Run state and history live next to it; commit them for an audit trail or ignore `.flow/*/state.json`, `log.jsonl` and `runs/`.

To reuse the skill in another repository of the same kind, copy the skill and run `flow.mjs install` there: it writes a `project.md` skeleton listing every binding the skill needs. Fill in the values; runs refuse to start until every one is set.

### Modes of vajra

vajra runs **only when you invoke it**. What you ask for picks the mode:

| Mode | Ask for example | What it does |
|---|---|---|
| **Generate** | "Make me a workflow: …" | Infers your style profile and domain model, grills you, composes the graph and rails, writes and validates the skill, dry-runs it on the runtime, and installs the hooks for your agents |
| **Consult** | "What workflow do I need for …? Don't generate yet." | Runs only the grilling session and recommends a workflow |
| **Evolve** | "We keep skipping the review; update your-flow." | Applies the smallest change to a generated skill after a retro, a phase shift, or a change in risk or domain |
| **Inspect** | "Show me your-flow's graph and what it enforces." | Explains, renders or audits a generated skill and its rails |

## Why

Agents get much more reliable with a **routed playbook skill**: a router that sends each task to a playbook with clear steps, proof requirements and exits. The ones you can download have two problems:

1. **They encode someone else's world**: their team size, their tooling, their risk tolerance, and a generic picture of "your domain".
2. **Following them is optional.** A skill is prose. Under pressure, after a context compaction, or halfway through a long run, the agent skips the review, takes a shortcut past the gate, or runs the deploy because it seemed fine.

vajra fixes both. It builds the graph **around you**, and **enforces** it.

| | A downloaded workflow skill | A skill from vajra |
|---|---|---|
| Fits | Its author's team, stack and risk | Your declared style, your domain model, your exact commands |
| Domain | A preset, or nothing | Built for you at the resolution your work needs; generic steps are flagged |
| Following it | The honor system | A runtime that refuses illegal moves, and hooks that block what the graph forbids |
| Human approval | "Ask the user first" in prose | Only a message from the human passes a gate; the agent cannot approve itself |
| Correctness | Read it and hope | Graph-checked: no dead ends, no trap cycles, no skipped gates |
| Over time | Drifts until abandoned | Evolves after retros and phase shifts, with a recorded history and an audit log |

## Highlights

- **🛤️ Rails, not reminders.** Every generated skill carries `flow.mjs`, a zero-dependency runtime. It tracks which playbook owns the request and refuses exits the graph does not have. It runs each playbook's checks before any exit opens, and red checks route the run down the failure exit. Installed as lifecycle hooks, it blocks guarded irreversible commands until a human approves, limits edits to the active playbook's paths, and keeps the agent from touching its own run state.
- **♻️ Reusable across repositories.** The skill holds your way of working and your domain, never one repository. Commands, paths, URLs and other values of one repository are bindings (`${test}`, `${code}/**`), declared in the skill's `bindings.md` and given per project in `.flow/<skill>/project.md`. The validator rejects literal rails values and warns on repository paths anywhere in the skill.
- **🧩 No lock-in.** The generated skill is plain Agent Skills with spec-only frontmatter and no links outside itself. The runtime is a CLI any agent can run, and the hooks use the protocol current agents share (JSON on stdin, exit code 2 blocks). One command installs them for Claude Code, Codex and GitHub Copilot (CLI, cloud agent and VS Code).
- **🎯 Fits your domain, not a preset.** There are no "web" or "robotics" packs. vajra builds a domain model for you, split into areas as finely as the graph needs. It uses ten cross-cutting facets (measured outcome, stand-in ladder, physical world, data mutation…) as a checklist. The validator flags any playbook whose steps or "Done when" name nothing real.
- **🔥 It grills you before it builds, lightly.** It asks short rounds of choices, each pre-set to a recommendation, through your agent's own question tool, a one-page form, or plain text. It pushes back on process you would never run and on safeguards you forgot.
- **🧪 → 🏭 Exploration that can graduate.** Work is labeled `throwaway`, `tracer` or `hardened`. A label rises only through a gate that declares the raise, and spike code is rebuilt instead of promoted. Throwaway playbooks can write only to their scratch paths.
- **✅ Machine-checked.** The validator checks the graph, the gates, the rails and the domain fit, and whether the graph matches your profile.
- **🔁 Evolves with you.** Retros and phase shifts go through Evolve mode, which applies the smallest change to the graph. Every run is logged in `.flow/`, so you can see where the workflow actually hurts.

<details>
<summary>Why there are no "Works with" caveats for a single agent</summary>

The skill format follows the Agent Skills specification exactly: `SKILL.md` frontmatter uses only its fields, and every link resolves inside the skill directory, which the test suite checks. Agent-specific details live in one place, the installer's table of configuration files. Explicit invocation is expressed in the description, which every agent reads, rather than through one agent's private frontmatter flag.

</details>

## Rails, not reminders

Graph engineering, as agent frameworks practice it, is a state machine. Code owns the transitions between states, and the model works inside each state. State is checkpointed, and the run is interrupted for a human, then resumed. vajra builds that model on files and on interfaces every coding agent already has:

```mermaid
flowchart TB
  you(["You"])
  M["Any coding agent"]
  subgraph rails ["Rails"]
    direction LR
    F["flow.mjs<br/>CLI runtime"]
    K{{"Lifecycle hooks<br/>exit 2 = blocked"}}
  end
  G["playbooks/*.md<br/>graph + rails"]
  S[(".flow/your-flow/<br/>state + log")]
  X["Your repo<br/>commands and files"]
  M -- "start · step · finish · exit" --> F
  M -- "shell and edit calls" --> K
  you -- "approve / reject" --> K
  K -- "only if allowed" --> X
  G -. "defines" .-> rails
  F <-- "checkpoint" --> S
  K -- "reads" --> S
  classDef rail fill:#fee2e2,stroke:#b91c1c,color:#000
  class F,K rail
  style rails fill:#fff7f7,stroke:#b91c1c
```

| Concept | In agent graph frameworks | In a generated skill |
|---|---|---|
| Node / edge | Function or sub-agent / transition | Playbook / exit |
| Conditional edge | Chosen by code from a result | `on: pass` / `on: fail`, chosen by the playbook's `checks` |
| Checkpoint | Saved state per thread | `.flow/<skill>/state.json` per run, plus an append-only log |
| Interrupt / resume | Pause for human input, resume with a command | `[human-gate]` waits; only the human's `approve` / `reject` resumes it |

| Layer | Standard | Role |
|---|---|---|
| Packaging | Agent Skills | Any agent that loads skills can load the generated skill |
| Driving the run | Plain CLI (`node scripts/flow.mjs …`) | Every agent can run it, and it costs no context until used |
| Enforcement | Lifecycle hooks (JSON on stdin, exit 2 blocks) | Blocks and context injection that work whether or not the agent cooperates |
| Optional | MCP elicitation | A gate dialog the model cannot answer, for clients that support it (off by default: MCP tools cost context every session) |

A gated rollout in the generated `search-ranking-flow`. The agent never decides on its own that the ramp may widen:

```mermaid
sequenceDiagram
  actor You
  participant A as Agent
  participant F as flow.mjs
  participant K as Hooks
  A->>F: flow start ab-ramp
  A->>K: abctl ramp --percent 1
  K--xA: Blocked: step 2 [human-gate] not approved
  A->>F: flow step 2
  F-->>A: STOP, ask the human
  A->>You: Evidence so far. Approve the 1% stage?
  A->>K: flow approve
  K--xA: Blocked: only the user can approve
  You->>K: approve, go to 1%
  K->>F: record the approval
  A->>K: abctl ramp --percent 1
  K-->>A: allowed
  A->>K: abctl ramp --percent 50
  K--xA: Blocked: step 6 [human-gate] not approved
```

<details>
<summary>The same exchange as the runtime prints it</summary>

```console
$ flow start ab-ramp --request "ramp model 0412"
$ (agent) abctl ramp search-ranker-0412 --percent 1
[search-ranking-flow] Blocked: `abctl ramp` belongs to step 4 and step 2 [human-gate] is not approved.
                      Run `flow step 2`, then stop and ask the user.
$ flow step 2
STOP. Step 2 is a human gate: "The product owner approves the held-out evaluation and the 1% stage."
Present what the user needs to decide, then end your turn. Only the user can pass it.
$ (agent) node .../flow.mjs approve
[search-ranking-flow] Blocked: only the user can approve, reject or suspend, and flow.mjs hook and mcp are run by the agent harness, not from the shell. Stop and ask the user.
> (user) approve, go to 1%
[search-ranking-flow] The user approved step 2 of ab-ramp.
$ (agent) abctl ramp search-ranker-0412 --percent 1                    # allowed
$ (agent) abctl ramp search-ranker-0412 --percent 50
[search-ranking-flow] Blocked: `abctl ramp` belongs to step 7 and step 6 [human-gate] is not approved.
```

</details>

| Enforced | How |
|---|---|
| Only declared exits, only after "Done when" | `flow exit` refuses anything else; `flow finish` needs every step recorded |
| Checks decide the branch | `checks:` run on finish; exits marked `on: pass` / `on: fail` open accordingly |
| Human gates pass only by the human | The prompt hook records `approve` / `reject` from the human's message; the agent's attempts are blocked |
| Irreversible commands wait for their gate | The tool hook matches `irreversible:` patterns and checks the gate before that exact step |
| Throwaway stays throwaway | `writes: [scratch/**]` limits edits while a throwaway playbook is active |
| The agent stays oriented | Current playbook and next move are injected at session start and on every prompt during a run; stopping mid-playbook is bounced once |

Three levels (`advisory`, `standard`, `strict`) come from your profile. Install the hooks for the agents you use:

```bash
node <your-flow>/scripts/flow.mjs install --harness claude,codex,copilot   # any subset
```

The [rails reference](skills/vajra/references/rails.md) spells out what is enforced, and also where enforcement ends: choices between legal exits remain the agent's judgment, and an agent without hooks is held only by the runtime it drives.

## Same tool, different people, different graphs

| You say | You get |
|---|---|
| *"Offline experiments on click logs, then shadow traffic, then an A/B ramp. Revenue is on the line."* | Hypothesis → offline experiment → **decide** → ranker build with NDCG and latency checks → shadow validation → **A/B ramp** where the held-out week is spent once and each stage waits for the product owner. [Graph](examples/search-ranking-flow/graph.md) |
| *"Pick-and-place arm, ROS 2, Gazebo, one real arm. Sim first; the arm must be safe."* | Spikes in Gazebo and on bags → **decide** → increment → sim scenarios → **hardware trial** with an operator gate. The arm launch is a guarded command, and no playbook can write the safety limits. [Graph](examples/robot-grasp-flow/graph.md) |
| *"Two-week sprints, QA sign-off. B2B invoicing; customers' ERPs call our API."* | Sprint spine, expand-then-contract API changes with an OpenAPI breaking-change check, and a **QA release gate** with a migration dry run. Triggers automatically. [Graph](examples/scrum-team-flow/graph.md) |
| *"Infusion pump software, IEC 62304 class B. Traceability, named approver."* | V-model with trace checks that route pass and fail, guarded baseline and release commands, and strict rails: no edit without an active playbook. [Graph](examples/medical-v-model-flow/graph.md) |

The first one, simplified:

```mermaid
flowchart TB
  idea(["ranking idea"]) --> frame
  subgraph explore ["throwaway · experiments/ only"]
    direction LR
    frame["Frame hypothesis"] --> exp["Offline experiment<br/>NDCG@10 × 3 seeds"]
  end
  exp --> decide{{"Decide<br/>throwaway → tracer"}}
  decide -->|"go: rebuild, don't copy"| impl
  subgraph build ["tracer · ranker/ and serving/"]
    direction LR
    impl["Implement in ranker<br/>checks: tests · NDCG · p99"] --> shadow["Shadow validation<br/>24 h, p99 ≤ 40 ms"]
    shadow -->|"on fail"| impl
  end
  shadow -->|"on pass"| ramp{{"A/B ramp · tracer → hardened<br/>a human gate per stage"}}
  ramp -->|"approved stages"| live(["serving 100%"])
  classDef gate fill:#ede9fe,stroke:#6d28d9,color:#000
  classDef hardened fill:#bbf7d0,stroke:#15803d,color:#000
  class decide,ramp gate
  class live hardened
  style explore fill:#fef3c7,stroke:#b45309
  style build fill:#dbeafe,stroke:#1d4ed8
```

## How it works

```mermaid
flowchart TB
  subgraph inputs ["Inputs"]
    direction LR
    D["Your words"] ~~~ R["Repo and toolchain"]
  end
  subgraph model ["A model of you"]
    direction LR
    P["Style profile<br/>15 axes"] ~~~ DM["Domain model<br/>areas × facets"]
  end
  inputs --> model
  model <-- "short rounds of choices,<br/>pre-set to a recommendation" --> G["Grill"]
  G --> C
  subgraph build ["Build"]
    direction LR
    C["Compose<br/>spine · services · gates<br/>rails · prune"] --> V{{"Validate<br/>graph · rails · domain fit"}}
    V -- "errors, generic steps" --> C
    V -- "OK" --> DR["Dry-run<br/>on flow.mjs"] --> I["Install hooks"]
  end
  I --> S(["your-flow/"])
  classDef gate fill:#ede9fe,stroke:#6d28d9,color:#000
  class V gate
```

**Development style decides the topology.**

- Uncertainty and requirement stability pick the spine: discovery, sprint, flow, or plan-driven.
- The phase journey (explore → expand → extract) decides which lifecycles and promotion gates exist.
- Failure cost decides gate strictness, review depth and the rails level.
- Cadence, team size, verification posture, autonomy and parallelism tune each playbook.

Work moves between three lifecycles, and only gates move it up:

```mermaid
stateDiagram-v2
  direction LR
  [*] --> throwaway: an idea
  throwaway --> tracer: decide gate, rebuild instead of copy
  tracer --> hardened: promotion gate, checklist and a human
  throwaway --> [*]: no-go
  hardened --> throwaway: a new unknown, explored as a sub-problem
  note right of throwaway: edits limited to scratch paths
  note right of hardened: deploys guarded by the hooks
  classDef throwaway fill:#fef3c7,stroke:#b45309,color:#000
  classDef tracer fill:#dbeafe,stroke:#1d4ed8,color:#000
  classDef hardened fill:#bbf7d0,stroke:#15803d,color:#000
  class throwaway throwaway
  class tracer tracer
  class hardened hardened
```

**The domain model decides the work.** It is built for you, not picked from a list. Areas are split only as finely as the graph needs: perception and motion on a robot, the ranking model and the serving path in search. Each area gets its [facets](skills/vajra/references/facets/README.md), an evidence ladder from cheapest to real, the irreversible actions with their commands, lead times and vocabulary. Each facet says where those facts must show up: which evidence, which gates, which guarded commands. The facts themselves come from your repository and your answers. Physical safety rules always win.

### What you get

```
your-flow/
├── SKILL.md          router: request type → entry playbook; runs go through flow.mjs
├── playbooks/*.md    nodes: steps, "Done when", exits, plus checks / writes / irreversible rails
├── principles.md     only the principles your graph needs
├── profile.md        your profile (machine-readable), domain model, interview log
├── bindings.md       the repository values the skill needs, by name (${test}, ${code}, ${deploy})
├── graph.md          Mermaid graph, rendered by the validator
└── scripts/
    ├── flow.mjs      the runtime: CLI, lifecycle hooks, optional MCP server
    ├── guard.mjs     what the hooks block: shell and edit calls that touch the state or the rails
    └── validate.mjs  the validator (also used by the runtime)

.flow/your-flow/project.md   per repository, outside the skill: the values and the repository facts
```

A playbook's frontmatter is both the graph and its rails, with this repository's values as bindings:

```yaml
---
id: shadow-validation
title: Shadow validation
phase: expand
lifecycle: tracer
kind: work
checks:
  - ${shadow-check}
exits:
  - to: ab-ramp
    when: 24 hours of shadow traffic stayed within the budget
    on: pass
  - to: implement-ranker
    when: latency or errors broke the budget
    on: fail
---
```

```yaml
# .flow/search-ranking-flow/project.md
shadow-check: python -m rankeval shadow --model shadow --since 24h --max-p99-ms 40 --max-error-rate 0.001
```

## The validator

```bash
node skills/vajra/scripts/validate.mjs path/to/your-flow [--project path/to/repo] --write-graph
```

| Checks | Severity |
|---|---|
| Missing exit targets, unreachable playbooks, trap cycles with no way to an end | error |
| A lifecycle raised without a gate that declares it, including detours through service playbooks | error |
| Work entering a promotion gate below the gate's level (throwaway code at a production gate) | error |
| `[irreversible]` steps without a preceding `[human-gate]` | error |
| Invalid or unsupported frontmatter, malformed rails, empty required sections, schema version mismatch | error |
| Rails values written as literals instead of bindings; bindings used but not declared; with `--project`, bindings the project leaves unset | error |
| Paths, globs or URLs of one repository anywhere in the skill | warning |
| Router invocation that contradicts the profile | error |
| Steps or "Done when" that name nothing concrete; a missing domain model | warning |
| Irreversible steps without guarded commands; kept code without checks; rails too weak for the risk | warning |
| The profile's journey needs a promotion gate the graph lacks; regulated gates without a human gate | warning |
| `SKILL.md` frontmatter outside the Agent Skills specification; `name` not matching the directory | error |
| Missing or outdated runtime in the generated skill | warning |

It writes `graph.md` only when there are no errors. Node 18+, no dependencies.

## Examples

Complete generated skills, also used as test fixtures. See [examples/](examples/README.md).

| Example | Style | Facets | Rails |
|---|---|---|---|
| [search-ranking-flow](examples/search-ranking-flow/) | Discovery → serving ladder | measured-outcome, data-dependence, stand-in-ladder, resource-budgets | standard |
| [robot-grasp-flow](examples/robot-grasp-flow/) | Discovery → flow, hardware | physical-world, stand-in-ladder, data-dependence, measured-outcome | strict |
| [scrum-team-flow](examples/scrum-team-flow/) | Sprint, team of five | shared-contracts, data-mutation | standard |
| [medical-v-model-flow](examples/medical-v-model-flow/) | Plan-driven, regulated | reproducibility, external-release, stand-in-ladder | strict |

## Evals

[`evals/`](evals/README.md) holds structural evals. Each case has a declaration, interview answers, and assertions such as *"every irreversible step has a guarded command"*, *"no generic steps"* or *"the gates promote throwaway → tracer and something → hardened"*. Playbook names are never asserted. Cases with a reference example must pass on it in `npm test`. The `crop-drone` case has no example and is for live runs only: it tests how the generator handles a domain it has never seen.

## Repository layout

```
skills/vajra/       the installable meta skill
├── SKILL.md                  entry point and mode router
├── workflows/                generate, consult, evolve, inspect
├── references/               profile axes, composition, domain model, rails, gates and lifecycles,
│   ├── facets/               graph model, authoring, calibration; cross-cutting domain facets
│   └── blueprints/           playbook blueprints (one file each)
├── templates/                skeletons for generated files, and the consult round spec
└── scripts/
    ├── validate.mjs          validator and graph renderer
    ├── interview.mjs         consult rounds as chat text, a one-page form, or a local form
    ├── flow.mjs              runtime (CLI, hooks, optional MCP), copied into every generated skill
    └── guard.mjs             the hooks' shell and edit checks, part of the runtime
examples/                     generated skills (calibration and test fixtures)
evals/                        structural eval cases and runner
tests/                        npm test
```

## Development

```bash
npm test            # validator, runtime, hooks, MCP, examples, blueprints, evals, docs-vs-code, self-containment
npm run examples    # refresh the runtime copies in examples/ and re-render their graphs
```

## License

[MIT](LICENSE)
