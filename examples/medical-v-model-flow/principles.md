# Principles

Apply these throughout. When a principle changes a decision, name it in your reply.

## Trace everything

Every requirement, design element, test and result carries ids that link to each other in `docs/trace.csv`. Applies to every playbook that creates or changes one of them.

## Prove it works

Show evidence from the real artifact (test output, report, log), not a claim. Applies to every "Done when".

## Pin behavior before changing it

Write the failing test before the code, and capture current behavior before restructuring. Applies to build-to-spec and problem-report.

## Gate the irreversible

Stop for the named approver before baselines, releases and anything else that cannot be undone. Applies wherever a step is tagged `[irreversible]`.

## Change goes through impact analysis

A change to a baselined requirement is analyzed for risk and affected items before any design or code moves. Applies to change-request and problem-report.
