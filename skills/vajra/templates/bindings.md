---
{{name}}: {{what the project supplies, e.g. "command that runs the unit tests and exits non-zero on failure"}}
{{name}}: {{e.g. "globs of the source and test files the build playbooks may edit"}}
---

# Bindings

Every value that changes from one repository to the next is a binding: commands, paths and globs, URLs, branch names, project keys, dashboards, thresholds of one service. Playbooks, the router and the principles write `${name}`; each project gives the value in `.flow/{{skill name}}/project.md`. The skill itself names no repository, so it can be copied into any project of this kind.

A value is a string, or a list `[a, b]` (several globs or commands). The runtime fills the values in when it runs checks, guards commands and limits edits, and `flow status` shows them for the active playbook.
