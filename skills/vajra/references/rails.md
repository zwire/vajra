# Rails

A playbook written in prose is a request. A rail is something the agent cannot get past by forgetting, skimming or rationalizing. Every generated skill carries a runtime, `scripts/flow.mjs`, that turns the graph into rails. It depends on no particular agent.

## How it lines up with common practice

Graph engineering, as agent frameworks practice it, models a workflow as a state machine. The transitions between states are deterministic and owned by code; the work inside a state is left to the model. State is checkpointed, and the run is interrupted for a human and resumed with their answer. The runtime implements the same model on top of files and standard agent interfaces:

| Concept | In agent graph frameworks | Here |
|---|---|---|
| Node | A function, LLM call or sub-agent | A playbook |
| Edge, conditional edge | A transition chosen by code from state or a result | An exit; `on: pass` / `on: fail` chosen by the playbook's checks |
| Graph definition | Code or a declarative spec | Playbook frontmatter, checked by `validate.mjs` |
| State and checkpoint | A checkpointer saving state per thread | `.flow/<skill>/state.json` per run, with an append-only `log.jsonl` |
| Interrupt and resume | Pause for human input, resume with a command | A `[human-gate]` step waits; only the human's `approve` / `reject` resumes it |
| Guard node, approval step | A node that blocks until conditions hold | Promotion gates (`promotes`), guarded `irreversible` commands |

The interfaces are standards current coding agents share:

| Layer | Standard | What it is used for |
|---|---|---|
| Packaging | Agent Skills (`SKILL.md` with spec-only frontmatter, `scripts/`, `references/`) | Any agent that loads skills can load the generated skill |
| Driving the run | A plain CLI (`node scripts/flow.mjs …`) | Every agent can run it; it costs no context until used |
| Enforcement | Lifecycle hooks: JSON on stdin, exit code 2 blocks, `hookSpecificOutput.additionalContext` for context | Block guarded commands and out-of-bounds edits, capture approvals, inject state, bounce premature stops |
| Optional | MCP server with elicitation | A human gate answered in a dialog the model cannot fill, for clients that support elicitation |

## Layers

| Layer | When | Enforces |
|---|---|---|
| Validator (`validate.mjs`) | Generation and Evolve | The graph itself: exits exist, no trap cycles, lifecycles rise only through gates that declare it, irreversible steps sit behind human gates |
| Runtime (`flow.mjs`) | Every run | The agent's moves: one active playbook, steps recorded with evidence, human gates passed only by the human, checks run before exits open, only declared exits taken |
| Hooks | Every tool call, prompt and stop | Work outside the runtime: guarded commands blocked until their gate is approved, edits limited to the active playbook's paths, approvals only from the human's own message, state protected, run state injected into context |

## The run

State lives in `.flow/<skill>/` at the project root: `state.json` (the active run), `log.jsonl` (every event, append-only) and `runs/` (finished and abandoned runs). Commit it for an audit trail, or ignore it.

The same directory holds `project.md`, this repository's values for the skill's bindings (see [graph-model.md](graph-model.md#bindings)). The skill names no repository; the runtime reads `project.md` and fills the values into checks, guarded commands, write limits and the step text `flow status` shows. Commit it. A run cannot start while a binding has no value, so a copied skill never runs with another project's commands.

```
start <entry> --request "…"      only router entries; one run at a time (--abandon "<reason>" to replace it)
step <n> --evidence "…"          or --skip "<reason>"; steps behind an unapproved human gate are refused
step <n>                         on a [human-gate] step: interrupts the run and tells the agent to stop and ask
finish --evidence "…"            needs every step recorded; runs the playbook's checks
exit <to> --because "…"          only exits open for the check result (on: pass | on: fail); the next playbook starts
pause --note "…" / resume        a clean stop mid-playbook; while paused, edits are free for other work (except under strict rails) and guarded commands stay blocked
status / log                     where the run is, and what happened
```

## Human gates

When the agent reaches a `[human-gate]` step, `flow step <n>` interrupts the run, exits with code 3 and prints a STOP message. The gate resumes only when the human:

- replies with a message that starts with `approve` (or `reject <reason>`): the prompt hook records it, because only the human writes prompts; or
- runs `node <skill>/scripts/flow.mjs approve` (or `reject --reason …`) in their own terminal; or
- answers the elicitation dialog, when the optional MCP server is installed and the client supports elicitation.

The tool hook blocks the agent from running `approve`, `reject`, `suspend` or `unsuspend`, and `flow.mjs hook` or `mcp` (which a forged prompt or elicitation answer could use to approve), and from changing `.flow/` directly, which covers the project bindings in `project.md`: loosening a `writes` glob or emptying a guarded command there would loosen the rails. Reading `.flow/` with `cat`, `jq`, `grep`, `Get-Content` and the like is allowed. The skill's own files (playbooks, profile, scripts) and the hook settings that enforce them change only while the human has run `flow suspend`, so the agent cannot switch its rails off; other edits to the settings files are allowed as long as they keep the `flow.mjs` hooks and do not set `disableAllHooks`. A rejected gate skips the steps behind it; the agent finishes the playbook and takes the exit that fits.

## Rails levels

| | advisory | standard | strict |
|---|---|---|---|
| Runtime enforces transitions, gates and checks when used | ✓ | ✓ | ✓ |
| Run state injected at session start and on every prompt during a run | ✓ | ✓ | ✓ |
| Approvals only from the human; `.flow/` protected | ✓ (chat approvals) | ✓ | ✓ |
| Guarded `irreversible` commands blocked outside their approved step | | ✓ | ✓ |
| Edits limited to the active playbook's `writes` | | ✓ | ✓ |
| Stopping mid-playbook bounced once per state of progress | | ✓ | ✓ |
| Edits blocked when no playbook is active | | | ✓ |

## Installing

```bash
node <skill>/scripts/flow.mjs install --harness claude,codex,cursor,copilot,antigravity,qwen,factory,windsurf   # any subset
node <skill>/scripts/flow.mjs install --harness claude --scope local          # personal settings where the agent has them
node <skill>/scripts/flow.mjs install --harness cursor --mcp                  # also register the optional MCP server
node <skill>/scripts/flow.mjs install --harness codex --dry-run               # print the files instead of writing them
```

The hook command and its behavior are the same for every agent; only the configuration file and event names differ:

| `--harness` | Hooks file | Events used | MCP file (with `--mcp`) |
|---|---|---|---|
| `claude` | `.claude/settings.json` (or `settings.local.json`) | SessionStart, UserPromptSubmit, PreToolUse, Stop | `.mcp.json` |
| `codex` | `.codex/hooks.json` (needs `codex_hooks = true` under `[features]`) | SessionStart, UserPromptSubmit, PreToolUse, Stop | `.codex/config.toml` |
| `cursor` | `.cursor/hooks.json` | sessionStart, beforeSubmitPrompt, preToolUse, stop | `.cursor/mcp.json` |
| `copilot` | `.github/hooks/<skill>.json` (read by Copilot CLI, cloud agent and VS Code) | SessionStart, UserPromptSubmit, PreToolUse, Stop | by hand |
| `antigravity` | `.agents/hooks.json` (read by the CLI, IDE and app) | PreInvocation, PreToolUse, Stop | by hand |
| `qwen` | `.qwen/settings.json` (trusted folders only) | SessionStart, UserPromptSubmit, PreToolUse, Stop | `.qwen/settings.json` |
| `factory` | `.factory/hooks.json` if it exists, else `.factory/settings.json` | SessionStart, UserPromptSubmit, PreToolUse, Stop | by hand |
| `windsurf` | `.devin/hooks.json` if it exists, else `.windsurf/hooks.json` | pre_user_prompt, pre_run_command, pre_write_code | by hand |

Installing merges entries without touching anything else and is idempotent. When the project has no `.flow/<skill>/project.md` yet, it also writes a skeleton listing each binding with its description; fill in every value before the first run. It never overwrites an existing project file. The hook reads the payload fields these agents share (`cwd`, `tool_name`, `tool_input`, `prompt`, `hook_event_name`). It recognizes their shell tools (`Bash`, `Shell`, `run_shell_command`, `Execute`, `run_in_terminal`, …) and edit tools (`Edit`, `Write`, `Create`, `write_file`, `replace`, `replace_string_in_file`, `apply_patch`, …). Windsurf (`agent_action_name`, `tool_info`) and Antigravity (`workspacePaths`, `toolCall` with `CommandLine` / `TargetFile`) send their own payloads, which the hook translates.

An agent not in the table can still use the rails: point its hook mechanism at `node <skill>/scripts/flow.mjs hook <session-start|user-prompt|pre-tool-use|stop>`. If it has no hooks, the runtime still enforces everything in the run section when the agent drives runs through the CLI, as the router tells it to.

The human can turn the hooks off and on with `flow suspend` and `flow unsuspend` (for example while running vajra Evolve on the skill).

## Why MCP is optional

MCP tool schemas sit in the context of every session, and an agent may still choose not to call them, which is the weakness rails exist to remove. The CLI costs nothing until used, and hooks fire whatever the agent chooses. The one thing MCP adds is elicitation: a dialog shown by the client that the model cannot answer. Install it with `--mcp` when the client supports elicitation and you want that dialog for human gates; otherwise leave it out.

## Limits

Be honest with the user about what is enforced and what is not:

- **Choices stay with the agent.** Which entry matches a request and which open exit fits are judgments. The runtime limits them to legal options, and checks with `on: pass | fail` route the most important branch mechanically.
- **Evidence text is self-reported** unless a check backs it. Put everything that can be checked mechanically into `checks`.
- **Command guards match command text** (substring or `/regex/`) where a command starts. The line is read as POSIX shell, and also as PowerShell when it may run there (a PowerShell tool, a non-Bash shell on Windows, or a line that looks like PowerShell), so a pattern that only appears in a quoted argument, a comment or a heredoc body (a commit message, a grep pattern, notes) does not trigger, while `$(...)`, `sh -c`, `eval`, `ssh`, `pwsh -Command`, `pwsh -EncodedCommand`, `cmd /c`, `Invoke-Expression` and `Start-Process`, and heredocs or pipes that feed a shell (`bash <<EOF`, `echo ... | sh`, `... | pwsh -Command -`), are checked. A line the reader cannot parse is matched as plain text. A line nested deeper than the reader follows, or built to multiply its work, is refused outright, and so is any tool call the hook fails to check.
- **`.flow/` and the rails are protected by the paths a command names**, in any case and with either slash, including globs that could expand to them (`.fl*`), deleting a directory that holds them (`rm -rf .`, `rm -rf .claude`), pipes into a deleting command (`gci .flow | Remove-Item`), and any mention inside interpreter code (`python -c`, `node -e`). Not caught: a path built at run time (`$D`, string concatenation, Windows short names like `FLOW~1`), a script written to a file and run later (`cat > x.sh <<EOF`, then `bash x.sh`), commands that rewrite the whole tree without naming it (`git stash -u`, `git checkout .`, `tar x`, `rsync --delete`), aliases and shell functions, and `cd` into a protected directory followed by a relative path (so `cd .flow` and `cd` into the skill are blocked themselves). Together these stop drift and mistakes, not a determined adversary: an equivalent command written differently is not caught. Guard the commands people actually use, and prefer wrapper scripts (`npm run deploy`) that are easy to match.
- **`writes` covers the agent's edit tools.** Files changed through shell commands are not checked.
- **Hooks differ in reach between agents.** Some fire tool hooks only for shell commands, and some cannot inject context on every event. Blocking with exit code 2 is the common ground; check the agent's own documentation for the rest. Known gaps: Copilot CLI runs repository hooks only in a folder the user has trusted, and drops the output of prompt hooks, so run state is injected only at session start (the Copilot hooks pass `--format copilot`, which emits the deny reason and session context in the fields Copilot reads). Windsurf has no session-start or stop hook and cannot inject context, so it gets blocking and chat approvals only. Copilot's cloud agent has no human in the loop mid-run, so a run that reaches a human gate stops there. Antigravity has no prompt hook: run state is injected at the first model call of each turn, but chat replies never reach the hook, so human gates are passed with `flow approve` in a terminal; it reads decisions only as JSON (`--format antigravity`), and runs no hooks at all under `--dangerously-skip-permissions`.
- **An invalid graph turns the rails off** rather than blocking the agent; the injected context says so until the graph validates again.
