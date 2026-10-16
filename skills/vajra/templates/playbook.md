---
id: {{id}}
title: {{Title}}
phase: {{explore|expand|extract|any}}
lifecycle: {{throwaway|tracer|hardened|any}}
kind: {{work|gate|service}}
promotes: {{from->to, e.g. throwaway->tracer; only on a gate that raises a lifecycle, otherwise delete this line}}
checks:                      # {{commands that prove Done when mechanically, as bindings; delete if none}}
  - {{a binding, e.g. ${test}}}
writes: [{{paths this playbook may edit, as bindings, e.g. ${scratch}/**; delete to allow all}}]
irreversible: [{{the commands of the [irreversible] steps, as bindings, e.g. ${deploy}; delete if none}}]
exits:
  - to: {{next-id}}
    when: {{condition the agent can check from evidence}}
    on: pass                 # {{only with checks}}
  - to: {{fallback-id}}
    when: {{a check failed}}
    on: fail
  - to: end
    when: {{condition}}
---

# {{Title}}

## Purpose

{{One or two sentences: the job of this playbook and what it produces.}}

## Parameters

- Timebox: {{value or "none"}}
- {{other tunables: approver, timebox; paths and commands are bindings}}

## Steps

1. {{Imperative, checkable step naming the real command, tool or artifact; repository-specific values as `${binding}`.}}
2. {{...}}
3. [human-gate] {{Only before an irreversible step.}}
4. [irreversible] {{The irreversible step, naming its guarded command, e.g. Run `${deploy}`.}}

## Done when

- {{This domain's evidence that proves the job is done: a metric, a file, a link, a command's output.}}

## Reply with

- {{What to report: evidence, decision, which exit is next.}}
