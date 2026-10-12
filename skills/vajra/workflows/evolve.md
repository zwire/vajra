# Evolve a generated workflow skill

Change an existing generated skill without losing what already works. Copy these steps into your todo list.

## 1. Load the current state

- Read the skill's `profile.md`, `SKILL.md`, `graph.md` and the playbooks named in the request.
- Run `node scripts/validate.mjs <skill-dir>` to confirm the starting point is valid. If it is not, fix the existing errors first and say so.
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
| Rails too loose or too tight (an irreversible command slipped through, hooks block routine work) | Add the missing `irreversible` pattern or `writes` path; change `rails` with the reason |

## 3. Consult

Run [consult.md](consult.md) scoped to the change: grill only the axes, domain areas, facets and playbooks the change touches. For a friction complaint, challenge the necessity of the process involved; for a failure, ask where it entered and what would have caught it.

## 4. Update the profile

Edit `profile.md`: change the affected axis values in the frontmatter and the source table, update `generator` to the current version, and append a dated line to its `## History` section with the reason. Every graph change must trace back to a profile change or a recorded retro finding.

## 5. Apply the smallest graph change

Re-run only the relevant parts of [../references/composition.md](../references/composition.md). Prefer, in order: editing a step, editing an exit condition, editing gate strictness, adding a playbook, restructuring the spine.

Keep playbook ids stable so existing habits, links and run logs keep working. When you remove a playbook, redirect every exit that pointed to it.

Copy `scripts/flow.mjs` and `scripts/validate.mjs` from this skill over the generated skill's copies so its runtime matches the validator (the validator warns when they differ). If a run is active in `.flow/<name>/`, tell the user: a playbook it points to may have changed.

## 6. Validate, render, dry-run

```bash
node scripts/validate.mjs <skill-dir> --write-graph
```

Walk the request that motivated the change through the new graph and confirm the change has the intended effect.

## 7. Hand over

Reply with what changed (playbooks added, removed or edited; gates moved), why (the profile change), and the updated Mermaid graph.
