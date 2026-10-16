# Authoring the generated skill

Rules for writing the files of a generated workflow skill so that an agent follows them reliably.

## Router (`SKILL.md`)

- **Frontmatter `description` is the trigger.** Say what the skill does and when to use it, with the user's own phrases and the invocation name: "Takumi's workflow for … Use for any non-trivial coding task in this repo, or when the user says /takumi-flow." Keep it under 1024 characters.
- **Keep it thin.** The router holds: one-paragraph purpose, how to run a playbook, the routing table, the phase model, and links. Everything else goes in playbooks or `principles.md`. Stay well under 500 lines.
- **Routing table rows are request types, not playbook names.** "Reported defect" → `bug-fix`, "A question I can't phrase yet" → `frame-the-question`. Add a final row for "nothing fits": pick the closest playbook and say which, or ask one question.
- **"How to run" drives the runtime.** Use the section from [../templates/router.md](../templates/router.md) unchanged except for the skill name and the autonomy rule. Do not write where the skill is installed: the agent runs `scripts/flow.mjs` from the skill's own directory, wherever it was copied. Every run goes through `flow start`, `flow step`, `flow finish` and `flow exit`.
- **Phase model section**: one short table of the lifecycles this skill uses and which gate moves between them. Omit it when only one lifecycle exists.

## Domain fit

Apply the [specificity rules](domain-model.md#specificity-rules) to every file. The test is whether a practitioner in this domain would recognize their own work: real tool names, real commands, the evidence they would demand, the words they use. Generic wording is acceptable only in genuinely generic services (`investigation`), and even there prefer the domain's artifacts ("file:line, bag timestamps, log lines").

## Playbooks

- One playbook, one job. Name it with a verb or a noun the user already uses.
- Frontmatter follows the contract in [graph-model.md](graph-model.md#playbook-frontmatter-contract) exactly.
- **Steps are imperative and checkable.** "Run `${test}` and keep the output", not "make sure tests are good".
- **Put concrete commands in steps as bindings.** The command, path or URL of this repository is `${name}`, declared in `bindings.md` with what it must do, and valued in the project file. Never write the value into the skill; the skill must work unchanged in the next repository of the same kind. If a value is unknown, still declare the binding and leave it for the user to fill in.
- **"Done when" is evidence, not effort.** Name the artifact that proves it: output, test result, screenshot, decision record, link.
- **Parameters** (timebox, scratch path, approver) go in a `## Parameters` section at the top so Evolve can tune them without touching steps.
- **Reply with**: list what the agent reports when the playbook ends (evidence, decision, next exit). Short.
- Up to 12 steps. Longer means two playbooks.
- **Rails in frontmatter, not only prose.** If a step says "run the tests", the command's binding also goes into `checks`. If a step is `[irreversible]`, its command's binding goes into `irreversible`, and the step names the same binding. If the playbook must not touch a path, set `writes` with path bindings. Give failure exits `on: fail`. See [composition.md](composition.md#6-lay-the-rails).
- **Steps line up with the runtime.** The agent records each numbered step with `flow step <n>`, so keep one action per numbered step and put sub-points in prose under it rather than as extra numbers.
- Reference principles by name and link (`[Prove it works](../principles.md#prove-it-works)`) instead of restating them.

## Principles (`principles.md`)

Include only principles that change a decision somewhere in this graph. Each principle: a name, one sentence of rule, one sentence of when it applies. Typical candidates, chosen by profile:

| Principle | Include when |
|---|---|
| Smallest change that works | Always |
| Prove it works on the real artifact | Always |
| Fix root causes | `bug-fix` present |
| Throwaway means throwaway | `throwaway` lifecycle present |
| Rebuild, don't promote | `decide` present |
| Timebox exploration | Any explore playbook present |
| Pin behavior before changing it | `harden` or `refactor` present |
| Shape decides topology | `parallelism` not `none` |
| Gate the irreversible | Any `[irreversible]` step present |
| Encode lessons in structure | `retro` present |

## Style

- English, second person imperative, present tense.
- No filler, no motivation paragraphs, no emojis.
- Use the user's vocabulary from the profile ("story", "ticket", "experiment").
- Prefer tables for routing and checklists; numbered lists for steps.
- Never mention vajra inside the generated playbooks except in `retro` (to evolve) and in `graph.md` (generated header).
