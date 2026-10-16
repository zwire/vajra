# Inspect a generated workflow skill

Explain, visualize or audit an existing workflow skill. Read-only unless the user asks for fixes (then switch to [evolve.md](evolve.md)).

## Steps

1. Locate the skill directory (ask only if several candidates exist).
2. Run `node scripts/validate.mjs <skill-dir> --mermaid` and keep the output. If the user asks about a run, read it with `node <skill-dir>/scripts/flow.mjs status` and `flow log`.
3. Read `profile.md` and `SKILL.md`.
4. Answer what was asked:
   - **"Show me the graph"**: the Mermaid output, plus one line per playbook.
   - **"Is it valid?"**: the validator result, each error explained in one sentence with the fix.
   - **"Why does it do X?"**: trace X to the playbook step, then to the profile value, domain model entry or composition rule that produced it.
   - **"What is enforced?"**: list the rails level, guarded commands, write limits and checks per playbook, with their bindings resolved from `.flow/<name>/project.md` (`node scripts/validate.mjs <skill-dir> --project <project-root>` reports unbound names), for which agents hooks are installed (look for `flow.mjs hook` in `.claude/settings*.json`, `.codex/hooks.json`, `.cursor/hooks.json`, `.github/hooks/*.json`, `.agents/hooks.json`, `.qwen/settings.json`, `.factory/hooks.json` or `.factory/settings.json`, `.devin/hooks.json` or `.windsurf/hooks.json`), and the limits from [../references/rails.md](../references/rails.md#limits).
   - **"Is it a good fit?"**: compare the profile to the graph using [../references/composition.md](../references/composition.md). Report gates that guard nothing irreversible, missing gates before irreversible steps, playbooks no route or exit reaches, heavy process the failure cost does not justify, generic steps that fail the swap test, and prose rules that should be rails.
5. Works on skills not made by vajra too: if playbooks lack the frontmatter contract, describe the structure by reading the files, and note that the validator needs the contract from [../references/graph-model.md](../references/graph-model.md#playbook-frontmatter-contract).
