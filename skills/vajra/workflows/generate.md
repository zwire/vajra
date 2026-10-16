# Generate a workflow skill

Turn a stated way of working into an installed, validated workflow skill that runs on rails. Copy these steps into your todo list. If you skip a step, keep it in the list and write down why.

## 1. Capture the declaration

Write down the user's words verbatim as the **declaration**. Typical declarations:

- "I start with fuzzy ideas, poke at them fast, and only harden what proves valuable."
- "Two-week sprints, PO-driven backlog, nothing ships without QA sign-off."
- "Regulated medical software: requirements are fixed and every change needs traceability."
- "Solo PoC for a client demo next Friday."

If the user gave nothing beyond "make me one", ask a single open question: *"How do you want to work, and what does 'done' mean for you?"*

## 2. Gather context silently

Before asking anything, look at what already answers profile and domain questions:

- Repository: languages, test setup, CI config, deploy config, `CONTRIBUTING.md`, PR templates, existing skills (`.agents/skills/`, `skills/`, or an agent's own skill directory), and which coding agents are configured (`.claude/`, `.codex/`, `.cursor/`, `.github/copilot-instructions.md` or `.github/hooks/`, `.agents/hooks.json` (Antigravity), `.qwen/`, `.factory/`, `.windsurf/` or `.devin/`).
- Toolchain: VCS host, CI, test runner, linter, type checker, package manager, exact commands.
- Domain signals: simulators, launch files, datasets and data directories, notebooks, benchmarks, golden files, device configs, migration tools, store or registry configs, the words in READMEs and issue titles.
- Maturity signals: tests present or absent, release tags, monitoring config, number of contributors.

Record each inferred value with its evidence (file path or command output).

## 3. Draft the style profile and domain model

Read [../references/style-profile.md](../references/style-profile.md). Fill every axis:

1. From the declaration (explicit words win).
2. From context (step 2).
3. From the archetype the declaration most resembles ([../references/composition.md](../references/composition.md#archetype-presets)).

Then read [../references/domain-model.md](../references/domain-model.md) and draft the domain model: areas, the [facets](../references/facets/README.md) of each area, evidence ladders, irreversible actions with exact commands, lead times, tools and vocabulary. Fill what the repository already tells you; mark the rest as open.

This is a draft. Do not ask questions yet.

## 4. Consult (grill)

Run [consult.md](consult.md) on the draft: short rounds of choices pre-set to your recommendations, on the lightest [answer surface](consult.md#answer-surfaces) the agent has, dependencies first, challenging both unnecessary process and missing safeguards. Push the domain model until every field is concrete enough to write a step with a real command or artifact in it. It ends with a proposed playbook list the user has accepted (or told you to go ahead with).

Write the final profile using [../templates/profile.md](../templates/profile.md): axis values (including `facets` and `rails`) in the frontmatter; sources, the domain model and the consult log in the body. Fill `generator` from `node scripts/validate.mjs --version`.

## 5. Compose the graph

Read [../references/composition.md](../references/composition.md) and apply it in order:

1. Choose the **spine** (the main path from request to done).
2. Add **service playbooks** the profile calls for (bug fix, investigation, refactor, QA, incident, retro).
3. Apply the **domain model**: rewrite steps and evidence in the domain's terms, add the playbooks the facets call for, collect irreversible actions and their commands.
4. Add **gates**: promotion gates between lifecycles the journey crosses (with `promotes`); human gates before irreversible steps; gate strictness from the failure-cost axis.
5. Set **parameters** per playbook: timeboxes, verification posture, parallelism, autonomy checkpoints, concrete commands from the toolchain.
6. Lay the **rails**: `checks`, `writes`, `irreversible` patterns and `on: pass|fail` exits per playbook; the `rails` level.
7. **Prune**: remove every playbook, step and gate that no profile value justifies. Merge playbooks that would always run back to back.

Copy blueprints from [../references/blueprints/](../references/blueprints/README.md). Blueprints are generic on purpose: they are skeletons, not output. Rename steps into the user's vocabulary, replace every generic phrase with the domain model's real commands and evidence, and drop what does not apply.

Sketch the graph as a list of nodes and exits before writing files. Check it against [../references/graph-model.md](../references/graph-model.md#topology-rules).

## 6. Pick the name and location

- Name: lowercase-hyphenated, ending in `-flow` unless the user picks something else (`takumi-flow`, `pocket-explore-flow`, `clinic-v-model-flow`).
- Location, in order of preference:
  1. Where the user asked.
  2. The project skill directory the user's agents read: `.agents/skills/<name>/` is read by many agents; some use their own (for example `.claude/skills/<name>/`). Pick the one every agent in use can see, or ask.
  3. To share it as a package: `skills/<name>/` at the root of a repository, installable with `npx skills add <owner>/<repo>`.

## 7. Write the files

Follow [../references/authoring.md](../references/authoring.md). Produce:

```
<name>/
├── SKILL.md          # router, from templates/router.md; drives runs through scripts/flow.mjs
├── principles.md     # from templates/principles.md, only principles the profile needs
├── profile.md        # frontmatter axes + domain model + consult log, so Evolve and the validator can reuse it
├── graph.md          # rendered by the validator, never written by hand
├── scripts/
│   ├── flow.mjs      # copied unchanged from this skill's scripts/
│   └── validate.mjs  # copied unchanged from this skill's scripts/
└── playbooks/
    └── <id>.md       # one per node, from templates/playbook.md
```

Set the router's invocation from the profile's `invocation` axis through the description only, so it works in every agent: `explicit` (default) says it runs only when invoked by name; `auto` writes a trigger-rich description. Keep the frontmatter to Agent Skills fields; add `compatibility: Requires Node.js 18+ for scripts/flow.mjs.` In the router's "How to run", write the real path to `flow.mjs` for the chosen location.

Every playbook needs the frontmatter contract from [../references/graph-model.md](../references/graph-model.md#playbook-frontmatter-contract) and the sections `## Purpose`, `## Steps`, `## Done when`. Every gate that raises a lifecycle declares it with `promotes: from->to`.

## 8. Validate and render

Run, from this skill's directory:

```bash
node scripts/validate.mjs <path-to-generated-skill> --write-graph
```

Fix every `ERROR` and re-run until it prints `OK` (`graph.md` is only written once there are no errors). Treat each `WARN` as a prompt to prune, split or reconsider. Domain-fit warnings ("names no concrete evidence") mean the playbook failed the swap test: rewrite it. Leave a warning only with a reason recorded in `profile.md` under `## Composition notes`.

## 9. Dry-run one request on the rails

Pick a realistic request from the user's declaration and walk it through the generated runtime in a throwaway state directory, so nothing lands in the project:

```bash
export FLOW_ROOT="$(mktemp -d)"
node <skill>/scripts/flow.mjs start <entry> --request "<the request>"
node <skill>/scripts/flow.mjs step 1 --evidence "dry run"
# … record each step, finish, and take the exits the request would take
node <skill>/scripts/flow.mjs status
unset FLOW_ROOT
```

Check that the expected entry matches, the exits you need are open, human gates stop the walk, and checks run the commands you expect (expect them to fail in the dry run if they need real work). If the walk hits a dead end, a missing gate, or a step the user would find pointless, go back to step 5.

## 10. Install the rails

Explain what the hooks will enforce at the chosen `rails` level and where enforcement ends (see [../references/rails.md](../references/rails.md)). Detect which agents the project uses from their configuration directories (`.claude/`, `.codex/`, `.cursor/`, `.github/hooks/`, `.agents/hooks.json`, `.qwen/`, `.factory/`, `.windsurf/` or `.devin/`) and ask about any others. Then:

1. [human-gate] Ask the user whether to install the hooks, for which agents, and at which scope (shared project settings or personal settings).
2. On yes, run `node <skill>/scripts/flow.mjs install --harness <agents> [--scope local]`. Show the files it changed.
3. Offer `--mcp` only when the user wants human gates answered in a client dialog and their client supports MCP elicitation; say that MCP tools cost context in every session.
4. For an agent without hooks, say so plainly: the runtime still enforces transitions, gates and checks when the agent drives runs through the CLI, but nothing blocks work done outside it.

## 11. Hand over

Reply with:

- The skill name, location, and how to invoke it (`/<name>` or by describing the task).
- The rendered Mermaid graph from `graph.md`.
- One line per playbook: what it is for.
- The rails: level, guarded commands, write limits, checks, and for which agents the hooks are installed.
- The profile values and domain model that most shaped the graph, and the assumptions you made instead of asking, so the user can correct them.
- How to evolve it: "Run vajra again after a retro or when the project changes phase."
