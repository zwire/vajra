# Facet: external-release

Releasing passes through someone else or cannot be called back: app stores, console certification, regulators, customer acceptance, package registries, OTA updates to devices in the field, printed or shipped artifacts.

## Present when

- A release waits on review, certification or approval outside the team.
- A shipped release cannot be withdrawn quickly from everyone who has it.

## Pin down in the domain model

- The external party, its checklist or requirements, and its lead time.
- What can be staged (beta tracks, cohorts, phased rollout) and how to halt a rollout.
- What is irreversible once submitted or published.

## Evidence

- The external checklist with evidence per item.
- Staged rollout health (crash rate, error rate, support tickets) before widening.

## Graph changes

- The release gate holds the external checklist; plan backwards from its lead time.
- Add staged rollout steps: small cohort, health check, `[human-gate]`, widen.
- Submission and publishing are `[irreversible]` steps.

## Rails

- `irreversible`: submit, publish and rollout commands (store upload tools, registry publish, OTA push).
- `checks`: the automated parts of the external checklist.

## Questions

- Who must approve the release outside the team, and how long do they take?
- How do you stop a bad release that has started rolling out?
- What can never be unpublished?
