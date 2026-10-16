---
test: command that runs the unit test suite and exits non-zero on failure
lint: command that runs the linter
typecheck: command that runs the type checker
contract-test: command that runs the public API contract tests against the OpenAPI spec
api-diff: command that diffs the OpenAPI spec against the default branch and exits non-zero on a breaking change
migrate-dry-run: command that dry-runs pending database migrations against the staging copy and prints row counts
e2e-staging: command that runs the end-to-end suite against staging
release: command that tags a release, runs production migrations and deploys
restore-drill: command that runs the database restore drill
default-branch: branch that stories merge into and releases are cut from
staging-url: URL of the staging environment used for demos and acceptance
tracker-project: Jira project key that holds the backlog, sprints and defects
openapi-spec: path of the public API's OpenAPI spec
contract-tests: directory of the API contract tests
changelog: path of the customer-facing changelog
migrations: directory of the database migrations
health-check: production health check endpoint that must be green after a release
error-dashboard: Grafana dashboard or panel that shows the production API error rate
release-watch: how long the error rate must stay at baseline after a release
sunset-notice: notice customers get before a deprecated API field or endpoint is removed
---

# Bindings

Every value that changes from one repository to the next is a binding: commands, paths and globs, URLs, branch names, project keys, dashboards, thresholds of one service. Playbooks, the router and the principles write `${name}`; each project gives the value in `.flow/scrum-team-flow/project.md`. The skill itself names no repository, so it can be copied into any project of this kind.

A value is a string, or a list `[a, b]` (several globs or commands). The runtime fills the values in when it runs checks, guards commands and limits edits, and `flow status` shows them for the active playbook.
