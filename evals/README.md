# Evals

Structural evals for the skills vajra generates. Each case in [`cases/`](cases/) holds a declaration, the answers a user would give during the consult, and assertions that any good result must satisfy: profile values and facets, which promotion gates exist, which lifecycles must be absent, human gates on promotions, guarded irreversible commands, checks on kept code, domain fit, and the runtime. Playbook names and wording are never asserted, so cases survive model changes and still catch regressions.

Cases with a `reference` example must pass on it; `npm test` checks this, which keeps the assertions satisfiable and the checker honest. Cases without one (`crop-drone`) are for live runs only: they test whether the generator fits a domain it has no example for.

## Run against an agent

Install vajra in the agent first (`npx skills add zwire/vajra`). Then, for each case, generate a skill non-interactively and check it. With Claude Code:

```bash
mkdir -p /tmp/lg-eval
for c in evals/cases/*.json; do
  out=/tmp/lg-eval/$(basename "$c" .json)-flow
  node evals/eval.mjs prompt "$c" "$out" | claude -p --permission-mode acceptEdits
  node evals/eval.mjs check "$c" "$out"
done
```

Any agent that accepts a prompt on stdin works the same way. Run each case several times when comparing models or after changing the references: generation is not deterministic, so look at pass rates, not single runs.

## Case format

```json
{
  "id": "scrum-team",
  "declaration": "the user's words",
  "answers": "facts the user would give when grilled",
  "reference": "examples/scrum-team-flow",
  "expect": {
    "profile": {
      "cadence": "timeboxed",
      "journey": { "includes": ["extract"], "excludes": ["explore"] },
      "hardware": { "oneOf": ["attached", "custom-hardware"] }
    },
    "playbooks": { "min": 5, "max": 12 },
    "promotes": ["*->hardened"],
    "lifecycles_absent": ["throwaway"],
    "human_gate_on_promotion": true,
    "irreversible": true,
    "guarded_irreversible": true,
    "checks_on_kept": true,
    "domain_fit": true,
    "runtime": true
  }
}
```

| Key | Passes when |
|---|---|
| `profile` | each axis matches: a scalar exactly, a list as a set, `{ "oneOf": [...] }`, or `{ "includes": [...], "excludes": [...] }` |
| `playbooks` | the playbook count is within `min`–`max` |
| `promotes` | a gate declares each raise (`*` matches any level) |
| `lifecycles_absent` | no playbook has these lifecycles |
| `human_gate_on_promotion` | every promotion gate has a `[human-gate]` step |
| `irreversible` | some step is (or no step is) tagged `[irreversible]` |
| `guarded_irreversible` | every playbook with `[irreversible]` steps declares their commands for the hooks |
| `checks_on_kept` | every kept-code work playbook has `checks` |
| `domain_fit` | the validator reports no domain-fit warnings (generic steps or evidence, missing domain model) |
| `runtime` | the skill carries the current runtime and its router drives runs through it |

Assert only what the declaration and answers determine; leave judgment calls out.
