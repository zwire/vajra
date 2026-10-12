# Facet: shared-contracts

Others consume an interface you change: public or internal APIs, database schemas read by other teams, file formats, SDKs, protocols, event schemas, CLI flags.

## Present when

- A change can break code you do not control or cannot deploy together with yours.
- Consumers upgrade on their own schedule.

## Pin down in the domain model

- The contracts and their consumers (known and unknown).
- The versioning and deprecation policy.
- Where consumer expectations are captured (contract tests, schema registry, example clients).

## Evidence

- Contract or consumer tests green against both the old and new interface during a transition.
- For removals: usage data showing no remaining consumers, or the deprecation window passed.

## Graph changes

- Add a contract change playbook using expand-then-contract: add the new shape, migrate consumers, remove the old shape later, each as a separate release.
- Removing or changing an existing field is an `[irreversible]` step behind a `[human-gate]`.

## Rails

- `checks`: contract tests and schema compatibility checks.
- `irreversible`: publish commands for SDKs, schemas or API versions.

## Questions

- Who consumes this, and can you see their usage?
- How long must the old shape keep working?
- What is published where it cannot be unpublished?
