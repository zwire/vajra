---
# Values of scrum-team-flow's bindings for this repository. Lives at .flow/scrum-team-flow/project.md.
# One line per name in the skill's bindings.md: a string, or a list [a, b].
test: pnpm test
lint: pnpm lint
typecheck: pnpm typecheck
contract-test: pnpm test:contract
api-diff: pnpm openapi:diff --base origin/main --fail-on-breaking
migrate-dry-run: pnpm db:migrate --dry-run --env staging
e2e-staging: pnpm test:e2e --env staging
release: pnpm release
restore-drill: pnpm db:restore-drill
default-branch: main
staging-url: https://staging.example.com
tracker-project: INV
openapi-spec: api/openapi.yaml
contract-tests: tests/contract/
changelog: CHANGELOG.md
migrations: db/migrations/
health-check: /healthz
error-dashboard: Grafana "api-errors" panel
release-watch: 30 minutes
sunset-notice: 90 days
---

# Project notes

Facts about this repository the workflow relies on. They stay here, not in the skill, so the skill stays reusable.

## Toolchain

| Purpose | Command or tool |
|---|---|
| Test | `pnpm test` |
| Lint / typecheck | `pnpm lint`, `pnpm typecheck` |
| VCS host / review | GitHub pull requests, one approving review |
| Deploy | `pnpm release` (tags, runs migrations, deploys through CI) |
| API contract | `pnpm test:contract`, `pnpm openapi:diff` |
| E2E on staging | `pnpm test:e2e --env staging` |
| Tracker | Jira, project `INV` |

## Where things live

- Staging: `https://staging.example.com`; demos and acceptance happen there.
- Public API spec: `api/openapi.yaml`; contract tests in `tests/contract/`.
- Customer-facing changelog: `CHANGELOG.md`.
- Database: Postgres, migrations in `db/migrations/`; `pnpm release` runs them in production; `pnpm db:restore-drill` takes about 40 minutes.
- Production health: `/healthz` and the Grafana "api-errors" panel; a release is verified when the panel stays at baseline for 30 minutes.
- Backlog, sprints and defects: Jira project `INV`.
- API deprecation policy: customers get 90 days' notice before a field is removed (stated by the team).
