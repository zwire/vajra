# Evolve a generated workflow skill

Change an existing generated skill without losing what already works. Copy these steps into your todo list.

## 1. Load the current state

- If the skill's hooks are installed, its own files are protected from the agent. Before you edit, run `node <skill-dir>/scripts/flow.mjs request suspend --reason "<the change>"`, say what you will change, ask the user to pick Suspend or Reject, and end your turn. When you are done, run `node <skill-dir>/scripts/flow.mjs unsuspend`.
- Read the skill's `profile.md`, `SKILL.md`, `bindings.md`, `graph.md`, the playbooks named in the request, and the project file `.flow/<name>/project.md`.
- Run `node scripts/validate.mjs <skill-dir> --project <project-root>` to confirm the starting point is valid. If it is not, fix the existing errors first and say so.
- If the validator reports an outdated `schema`, migrate first: apply each step in [../references/graph-model.md](../references/graph-model.md#schema-versions) from the skill's schema up to the current one, then set `schema` and `generator` in `profile.md`. Record the migration in `## History`.

## 2. Classify the change

| Trigger | Typical change |
|---|---|
| Retro finding ("we keep skipping X", "Y is pointless") | Edit steps; remove or merge a playbook |
| Phase shift (prototype found traction, product entering maintenance) | Change the `journey` axis, add or tighten gates, add hardening or production-readiness playbooks |
| Risk change (first paying customer, regulation, team growth) | Raise the failure-cost axis, raise gate strictness |
| Friction ("too slow", "too many approvals") | Lower gate strictness where failure cost allows; loosen timeboxes; remove gates that guard nothing irreversible |
| New recurring use case | Add one playbook with a route and exits |
| Repeated failure (bugs escaping, rework) | Add a proof requirement or gate exactly where the failure entered |
| New domain area (a vision system added to a robot, hardware arriving) | Add an area to the domain model with its facets; adapt evidence, irreversible commands and rails; add its playbooks |
| Rails too loose or too tight (an irreversible command slipped through, hooks block routine work) | Add the missing `irreversible` pattern or `writes` path through a binding; change `rails` with the reason |
| The repository changed (a command renamed, a directory moved), or the skill is reused in another repository | Change only the values in `.flow/<name>/project.md`; the skill stays as it is. Add a binding only when a new kind of value is needed |

## 3. Consult

Run [consult.md](consult.md) scoped to the change: grill only the axes, domain areas, facets and playbooks the change touches. For a friction complaint, challenge the necessity of the process involved; for a failure, ask where it entered and what would have caught it.

## 4. Update the profile

Edit `profile.md`: change the affected axis values in the frontmatter and the source table, update `generator` to the current version, and append a dated line to its `## History` section with the reason. Every graph change must trace back to a profile change or a recorded retro finding.

## 5. Apply the smallest graph change

Re-run only the relevant parts of [../references/composition.md](../references/composition.md). Prefer, in order: editing a step, editing an exit condition, editing gate strictness, adding a playbook, restructuring the spine.

Keep playbook ids stable so existing habits, links and run logs keep working. Keep the skill free of repository values: any new command, path or URL is a binding in `bindings.md` with its value in the project file. When a binding is added, add its value to every project file you know of, or tell the user which projects need it; runs there refuse to start until it is bound. When you remove a playbook, redirect every exit that pointed to it.

Copy `scripts/flow.mjs`, `scripts/validate.mjs` and the whole `scripts/lib/` folder from this skill over the generated skill's copies (delete a leftover `scripts/guard.mjs` from before `lib/`) so its runtime matches the validator (the validator warns when they differ). If a run is active in `.flow/<name>/`, tell the user: a playbook it points to may have changed.

## 6. Validate, render, dry-run

```bash
node scripts/validate.mjs <skill-dir> --write-graph
```

Walk the request that motivated the change through the new graph and confirm the change has the intended effect.

## 7. Hand over

Reply with what changed (playbooks added, removed or edited; gates moved), why (the profile change), and the updated Mermaid graph.
