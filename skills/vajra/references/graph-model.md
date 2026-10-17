# Graph model

## Elements

| Element | Represented as | Meaning |
|---|---|---|
| Router | `SKILL.md` of the generated skill | Matches a request to an entry playbook. Every `playbooks/<id>.md` link in `SKILL.md` is an entry point. |
| Node | `playbooks/<id>.md` | A playbook: purpose, ordered steps, proof ("Done when"), exits |
| Edge | An item in a playbook's `exits` frontmatter | "When `when` holds after this playbook, continue in `to`" |
| End | `to: end` or `terminal: true` | The request is finished |
| Gate | A node with `kind: gate` | Guards a boundary. Only a gate that declares `promotes` may raise a lifecycle, and only by the step it declares |
| Human gate | A step tagged `[human-gate]` | The run stops until the user answers |

## Playbook frontmatter contract

The validator (`scripts/validate.mjs`) reads exactly this shape. Keep it flat; no other YAML features.

```yaml
---
id: spike                 # must equal the file name without .md
title: Spike              # human-readable, used in the graph
phase: explore            # explore | expand | extract | any
lifecycle: throwaway      # throwaway | tracer | hardened | any
kind: work                # work | gate | service   (default: work)
exits:                    # required unless terminal: true
  - to: decide
    when: the question has an answer with evidence
  - to: frame-the-question
    when: the spike showed the question was wrong
  - to: end
    when: the answer is no-go
---
```

A gate that raises a lifecycle declares the raise:

```yaml
---
id: decide
title: Decide
phase: explore
lifecycle: any
kind: gate
promotes: throwaway->tracer   # from->to; only on kind: gate
exits:
  - to: tracer-bullet
    when: >
      the verdict is go and the decision record
      lists the first slice
---
```

Rails fields, all optional (see [rails.md](rails.md)). Their values differ per repository, so every entry names a [binding](#bindings):

```yaml
checks:                        # commands that must exit 0 for the run to take pass exits
  - ${test}
  - ${typecheck}
writes: [${scratch}/**]        # paths the playbook may edit (globs from the project root); [] for none, omit for any
irreversible:                  # commands of its [irreversible] steps; blocked elsewhere and before its human gate
  - ${deploy}
  - /ros2 launch \S+ ${real-launch}/
exits:
  - to: ship
    when: the checks are green
    on: pass                   # open only when checks passed (default for exits without on)
  - to: increment
    when: a check failed
    on: fail                   # open only when checks failed
```

Supported YAML: `key: value`, inline lists `[a, b]`, quoted strings, folded (`>`) and literal (`|`) blocks, plain values continued on more-indented lines, `#` comments, and one level of list items with keys. Anything else (deeper nesting, tabs, duplicate keys) is an error rather than a guess.

Required body sections, each non-empty: `## Purpose`, `## Steps` (numbered), `## Done when`. Recommended: `## Parameters` (timebox, commands), `## Reply with` (what the agent reports at the end).

Step tags the validator understands:

- `[irreversible]`: the step cannot be undone. Requires an earlier (or the same) step tagged `[human-gate]` in the same playbook.
- `[human-gate]`: stop and wait for the user.

## Bindings

A generated skill is reusable: it names no repository. Every value that changes from one repository to the next (a command, a path or glob, a URL, a branch name, a tracker key, a dashboard, a threshold of one service) is a binding, written `${name}` wherever it is needed: rails fields, steps, "Done when", the router, the principles and the profile. Names are lowercase letters, digits, `-` and `_`, starting with a letter.

The skill declares its bindings in `bindings.md`, one line each, saying what the project must supply:

```yaml
---
test: command that runs the unit tests and exits non-zero on failure
code: globs of the source and test files the build playbooks may edit
deploy: command that deploys to production
---
```

Each project gives the values in `.flow/<skill>/project.md`, a string or a list; its body holds the repository facts (toolchain, where data and artifacts live) that used to sit in the profile:

```yaml
---
test: pnpm test
code: [src/**, test/**]
deploy: pnpm release
---
```

The runtime fills the values in before it runs checks, matches guarded commands or limits edits. A list expands an entry into one entry per value (`${code}/**` with two values gives two globs); inside a `/regex/` pattern each value is escaped and a list becomes an alternation; in prose a list reads as `a, b`. Until every binding has a value, `flow start` refuses and the injected context names the missing ones. The project file is part of the rails: the agent changes it only while the human has run `flow suspend`. `flow install` writes a skeleton with each binding's description when the file is missing.

## Profile frontmatter

`profile.md` keeps the axis values in its frontmatter so the validator, Evolve and evals can read them. The table in the body records the source of each value.

```yaml
---
schema: 2                          # file contract version (see Schema versions)
generator: vajra@0.3.0   # from: node scripts/validate.mjs --version
uncertainty: complex
requirements: unknown
journey: [explore, expand, extract]
failure_cost: customer
artifact_lifetime: evolving
cadence: continuous
team: solo
verification: test-after
autonomy: medium
parallelism: explore-only
domains: [search-ranking]
facets: [measured-outcome, data-dependence, stand-in-ladder]
hardware: none
invocation: explicit
rails: standard
---
```

Allowed values are the ones in [style-profile.md](style-profile.md#axes); `domains` takes any lowercase-hyphenated names. The body must contain a concrete `## Domain model` section ([domain-model.md](domain-model.md)).

## Schema versions

`schema` in `profile.md` names the version of the file contract (playbook and profile frontmatter) a skill was written for. The validator accepts only its own schema: a newer one asks for a newer vajra, an older one asks for migration through Evolve. Evolve migrates by applying each step below in order, then sets `schema` and `generator`.

| Schema | Introduced in | Migration from the previous schema |
|---|---|---|
| 1 | 0.2.0 | Add `promotes: from->to` to every gate that raises a lifecycle. Move the profile axes into `profile.md` frontmatter with `schema: 1` and `generator`. Replace domain packs with `facets` and a `## Domain model` section. Add `rails`, and `checks`, `writes`, `irreversible` and exit `on` where the profile calls for them. Copy `scripts/flow.mjs` and `scripts/validate.mjs` into the skill and drive runs through them from the router. |
| 2 | 0.3.0 | Make the skill reusable. For every repository-specific value (paths, globs, commands, scripts, URLs, branch names, tracker keys, dashboards, thresholds of one service) in playbooks, the router, the principles and the profile, write `${name}`, declare `name` with a description in a new `bindings.md`, and put the value in `.flow/<skill>/project.md`. Move the profile's `## Toolchain` table and other repository facts into the project file's body. Replace the hard-coded `flow.mjs` path in the router's "How to run" with the text from [../templates/router.md](../templates/router.md). |

## Validator checks

Errors (must fix):

- `SKILL.md` exists with `name` (lowercase-hyphenated, ≤ 64 chars) and `description` (≤ 1024 chars).
- Frontmatter uses only the supported YAML subset.
- Each playbook has the frontmatter contract, non-empty required sections, at least one numbered step, and valid enum values.
- `promotes` appears only on gates, has the form `from->to`, and raises the lifecycle.
- `checks`, `writes` and `irreversible` are lists of strings, and every entry names a binding; `irreversible` appears only on playbooks with `[irreversible]` steps and its `/regex/` patterns compile; exit `on` is `pass` or `fail` and needs `checks`.
- Every `${name}` used anywhere in the skill is declared in `bindings.md`, with a description; names are lowercase.
- With `--project <root>` (or the project file itself): the project file exists and gives a value for every declared binding.
- Every non-terminal playbook has at least one exit; every exit has `to` and `when`; every `to` exists or is `end`.
- Every playbook linked from `SKILL.md` exists; every playbook is reachable from the router.
- Every playbook can reach an end (no trap cycles).
- No path raises a lifecycle without passing a gate that promotes it, and no path enters a promotion gate below the gate's `from` level (`any` playbooks and gates without `promotes` are transparent).
- `profile.md`, when present, has `schema` equal to the validator's schema and valid axis values.
- `SKILL.md` frontmatter uses only Agent Skills fields (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`), `name` matches the directory, `metadata` maps strings to strings.
- No `[irreversible]` step without a preceding `[human-gate]`.

Warnings (justify or fix): router over 500 lines, playbook over 12 steps, more than 15 playbooks, multiple lifecycles but no promotion gate, a gate that neither promotes nor stops at a human gate, an unusual phase and lifecycle pair, unknown frontmatter keys, `profile.md` missing.

Portability warnings: text in `SKILL.md`, `principles.md`, `profile.md` or a playbook that looks like it belongs to one repository (`./x`, `../x`, `~/x`, `/x`, `dir/`, `a/b.ext`, globs, `http(s)://` URLs), unless it is a file inside the skill or under `.flow/`; a declared binding no file uses; a project value the skill does not declare.

Domain-fit warnings: a work or gate playbook whose "Done when", or all of whose steps, name nothing concrete (no command, path, metric or link); a profile without a `## Domain model`.

Runtime warnings: `scripts/flow.mjs`, `scripts/guard.mjs` or `scripts/validate.mjs` missing, a runtime version different from the validator's, a router that does not mention `scripts/flow.mjs`.

Rails warnings: a guarded command that runs in steps behind different gates (ramp stages) and is named in one of them only in prose, or whose earlier step's command also fits a later step's (the runtime tells the stages apart by each step's own backtick command).

Composition warnings compare the profile with the graph (rules from [composition.md](composition.md)): the journey leaves explore but nothing promotes from `throwaway`; the journey reaches extract but nothing promotes to `hardened`; lifecycles exist that the journey does not include; a regulated profile has a promotion gate without a `[human-gate]`; hardware or customer-facing production without any `[irreversible]` step; `[irreversible]` steps without guarded commands when rails are on; hardware without the `physical-world` facet; an explicit-invocation profile whose description does not say so; `physical-world` with advisory rails; regulated work without strict rails; kept-code playbooks without `checks` when `verification` is not `evidence`; `physical-world` playbooks without `writes`. Fix them, or record the reason in `profile.md` under `## Composition notes`.

## Topology rules

Check the sketch against these before writing files.

1. **No fake edges.** Draw an exit only where work actually continues. "Could also go to X" is not an exit.
2. **Every exit has a decidable condition.** The agent must be able to tell from evidence whether `when` holds.
3. **Loops need a way out.** Exploration loops (`spike` ↔ `frame-the-question`) are fine because each has an exit to `decide` or `end`; the timebox bounds them.
4. **Shape follows the work.** Fan out (parallel variants, parallel charters, review panels) only for splittable work, using the diamond: split → parallel workers → verify in a separate context → merge under one owner. Sequential chains stay sequential.
5. **Gates sit on boundaries.** A gate belongs where a lifecycle changes (declare it with `promotes`) or an irreversible step follows. Nowhere else.
6. **Services are hubs, not detours.** Service playbooks (`investigation`, `bug-fix`) may be entered from the router and from many nodes, but must not become a path that skips a gate.
7. **One owner per request.** At any time one playbook owns the request; exits hand ownership over explicitly.
