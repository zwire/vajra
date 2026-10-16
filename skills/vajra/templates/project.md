---
# Values of {{skill name}}'s bindings for this repository. Lives at .flow/{{skill name}}/project.md.
# One line per name in the skill's bindings.md: a string, or a list [a, b].
{{name}}: {{value, e.g. pnpm test}}
{{name}}: [{{value}}, {{value}}]
---

# Project notes

Facts about this repository the workflow relies on. They stay here, not in the skill, so the skill stays reusable.

## Toolchain

| Purpose | Command or tool |
|---|---|
| Test | {{...}} |
| Lint / typecheck | {{...}} |
| VCS host / review | {{...}} |
| Deploy | {{...}} |

## Where things live

{{Data, artifacts, configs and dashboards the domain model refers to, with their paths or URLs, and the evidence each binding was taken from (file path or command output).}}
