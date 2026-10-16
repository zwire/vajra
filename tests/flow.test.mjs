// The runtime: CLI transitions and Claude Code hooks, run as separate processes like a harness would.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const scripts = path.join(root, "skills", "vajra", "scripts");

const SPIKE = `---
id: spike
title: Spike
phase: explore
lifecycle: throwaway
kind: work
writes: [\${scratch}/**]
exits:
  - to: ship
    when: the notes answer the question
---

## Purpose

Learn.

## Steps

1. Try it in \`\${scratch}/\`.

## Done when

- \`\${scratch}/NOTES.md\` holds the answer.
`;

const SHIP = `---
id: ship
title: Ship
phase: any
lifecycle: any
kind: work
checks:
  - \${ok-check}
irreversible: [\${deploy}]
exits:
  - to: end
    when: deployed
    on: pass
  - to: spike
    when: checks failed
    on: fail
---

## Purpose

Deploy.

## Steps

1. Build with \`make\`.
2. [human-gate] Confirm the deploy.
3. [irreversible] Run \`\${deploy}\`.

## Done when

- \`\${deploy}\` printed the URL.
`;

const BINDINGS = `---
scratch: directory for throwaway work
ok-check: command that proves the deploy is ready
deploy: command that deploys
rollout: command that rolls out in stages
---
`;

const PROJECT = `---
scratch: scratch
ok-check: test -f ok.txt
deploy: npm run deploy
rollout: rollout
---
`;

function project({ rails = "standard" } = {}) {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "lg-flow-"));
  fs.mkdirSync(path.join(proj, ".git"));
  const skill = path.join(proj, ".claude", "skills", "demo-flow");
  fs.mkdirSync(path.join(skill, "playbooks"), { recursive: true });
  fs.mkdirSync(path.join(skill, "scripts"));
  for (const f of ["flow.mjs", "validate.mjs"]) fs.copyFileSync(path.join(scripts, f), path.join(skill, "scripts", f));
  fs.writeFileSync(path.join(skill, "SKILL.md"), "---\nname: demo-flow\ndescription: Demo. Only use when the user invokes demo-flow by name.\n---\n\nDrive runs with `scripts/flow.mjs`.\n\n[spike](playbooks/spike.md) [ship](playbooks/ship.md)\n");
  fs.writeFileSync(path.join(skill, "playbooks", "spike.md"), SPIKE);
  fs.writeFileSync(path.join(skill, "playbooks", "ship.md"), SHIP);
  fs.writeFileSync(path.join(skill, "bindings.md"), BINDINGS);
  fs.mkdirSync(path.join(proj, ".flow", "demo-flow"), { recursive: true });
  fs.writeFileSync(path.join(proj, ".flow", "demo-flow", "project.md"), PROJECT);
  fs.writeFileSync(path.join(skill, "profile.md"), `---
schema: 2
generator: vajra@test
uncertainty: complex
requirements: unknown
journey: [explore, expand]
failure_cost: internal
artifact_lifetime: evolving
cadence: continuous
team: solo
verification: evidence
autonomy: medium
parallelism: none
domains: [demo]
facets: [shared-contracts]
hardware: none
invocation: explicit
rails: ${rails}
---

## Domain model

A demo.
`);
  const flow = path.join(skill, "scripts", "flow.mjs");
  const env = { ...process.env, CLAUDE_PROJECT_DIR: "", FLOW_ROOT: "" };
  const cli = (...args) => spawnSync(process.execPath, [flow, ...args], { cwd: proj, encoding: "utf8", env });
  const hook = (event, input) => spawnSync(process.execPath, [flow, "hook", event], { cwd: proj, encoding: "utf8", env, input: JSON.stringify({ cwd: proj, ...input }) });
  const bash = (command) => hook("pre-tool-use", { tool_name: "Bash", tool_input: { command } });
  const write = (file_path) => hook("pre-tool-use", { tool_name: "Write", tool_input: { file_path } });
  return { proj, skill, cli, hook, bash, write };
}

// Drive a fresh project to the waiting human gate in "ship".
function toGate(p) {
  p.cli("start", "spike", "--request", "try it");
  p.cli("step", "1", "--evidence", "notes written");
  p.cli("finish", "--evidence", "answer in notes");
  p.cli("exit", "ship", "--because", "notes answer it");
  p.cli("step", "1", "--evidence", "built");
  return p.cli("step", "2");
}

test("exits only open after finish, and only the ones the graph declares", () => {
  const p = project();
  assert.equal(p.cli("exit", "end", "--because", "x").status, 1);
  assert.equal(p.cli("start", "nowhere", "--request", "x").status, 1);
  assert.equal(p.cli("start", "spike", "--request", "try it").status, 0);
  assert.match(p.cli("exit", "ship", "--because", "x").stderr, /not finished/);
  assert.match(p.cli("finish", "--evidence", "x").stderr, /steps 1 are not recorded/);
  p.cli("step", "1", "--evidence", "notes written");
  assert.equal(p.cli("finish", "--evidence", "answer in notes").status, 0);
  assert.match(p.cli("exit", "end", "--because", "x").stderr, /"end" is not an open exit from spike/);
  assert.equal(p.cli("exit", "ship", "--because", "notes answer it").status, 0);
  assert.match(p.cli("status").stdout, /Active playbook: ship/);
});

test("a second run cannot start over an active one without --abandon", () => {
  const p = project();
  p.cli("start", "spike", "--request", "first");
  assert.match(p.cli("start", "ship", "--request", "second").stderr, /a run is active/);
  assert.equal(p.cli("start", "ship", "--request", "second", "--abandon", "wrong playbook").status, 0);
});

test("a human gate stops the agent and only the user passes it", () => {
  const p = project();
  const gate = toGate(p);
  assert.equal(gate.status, 3);
  assert.match(gate.stdout, /STOP\. Step 2 is a human gate/);
  assert.match(p.cli("step", "3", "--evidence", "x").stderr, /step 2 is a human gate that has not been approved/);
  assert.match(p.cli("step", "2", "--skip", "x").stderr, /cannot be skipped/);
  // The agent cannot approve through the shell when hooks are on.
  assert.equal(p.bash(`node ${path.join(p.skill, "scripts", "flow.mjs")} approve`).status, 2);
  // A question that merely starts with the word is not an approval.
  p.hook("user-prompt", { prompt: "approve? what would that do" });
  assert.match(p.cli("status").stdout, /waiting for the human/);
  const ok = p.hook("user-prompt", { prompt: "approve, ship it" });
  assert.match(ok.stdout, /The user approved step 2 of ship/);
  assert.equal(p.cli("step", "3", "--evidence", "deployed").status, 0);
});

test("a rejected gate skips the steps behind it", () => {
  const p = project();
  toGate(p);
  p.hook("user-prompt", { prompt: "reject: not today" });
  const s = p.cli("status").stdout;
  assert.match(s, /\[!\] 2\./);
  assert.match(s, /\[-\] 3\..*gate rejected/);
});

test("guarded irreversible commands run only in their playbook after the gate", () => {
  const p = project();
  assert.equal(p.bash("npm run deploy").status, 2);
  p.cli("start", "spike", "--request", "try it");
  assert.match(p.bash("npm  run   deploy --prod").stderr, /runs only inside playbook ship/);
  assert.equal(p.bash("npm test").status, 0);
  toGate(project()); // independent project: unaffected
  const q = project();
  toGate(q);
  assert.match(q.bash("npm run deploy").stderr, /step 2 \[human-gate\] is not approved/);
  q.hook("user-prompt", { prompt: "approve" });
  assert.equal(q.bash("npm run deploy").status, 0);
});

test("guards and protections match commands that run, not text that only mentions them", () => {
  const p = project();
  p.cli("start", "spike", "--request", "try it");
  const flow = path.join(p.skill, "scripts", "flow.mjs");
  // Mentions in quoted arguments, comments and heredoc bodies are data.
  for (const c of [
    'git commit -m "npm run deploy after review"',
    "grep -rn 'npm run deploy' docs",
    "echo npm run deploy",
    "# npm run deploy\nls",
    "cat <<'EOF' > scratch/NOTES.md\nnpm run deploy\n$(npm run deploy)\nEOF",
    `git commit -m "document ${flow} approve and .flow/ state"`,
  ]) assert.equal(p.bash(c).status, 0, c);
  // Real executions are still caught, wherever they sit in the line.
  for (const c of [
    "npm test && npm run deploy",
    "CI=1 sudo npm run deploy",
    'bash -c "npm run deploy"',
    "eval 'npm run deploy'",
    'echo "$(npm run deploy)"',
    "cat <<EOF\n$(npm run deploy)\nEOF",
    'ssh prod "cd app && npm run deploy"',
    `node "${flow}" approve`,
    "ls > .flow/x",
    'rm ".flow/demo-flow/state.json"',
    "bash <<'EOF'\nnpm run deploy\nEOF",
    "cat <<EOF | sudo sh\nnpm run deploy\nEOF",
    'echo "npm run deploy" | bash',
    'bash <<< "npm run deploy"',
    "echo 'unclosed npm run deploy",
  ]) assert.equal(p.bash(c).status, 2, c);
});

test("the run state is protected in every shell, while reading it is not blocked", () => {
  const p = project();
  p.cli("start", "spike", "--request", "try it");
  const ps = (command) => p.hook("pre-tool-use", { tool_name: "PowerShell", tool_input: { command } });
  const enc = (s) => Buffer.from(s, "utf16le").toString("base64");
  // POSIX shells: paths in any spelling, globs, pipes, interpreters and nested shells.
  for (const c of [
    "rm -rf ./.flow/", "rm -rf .FLOW", "rm -rf .fl*", "rm -rf .[!.]*", "mv .flow x", "echo x >> .flow/demo-flow/state.json",
    "tee .flow/x < y", "dd if=x of=.flow/s", "cd .flow && rm s", "sed -i s/a/b/ .flow/s", "sed -n 's/a/b/w .flow/z' x",
    "find .flow -delete", "find . -path '*/.flow/*' -exec rm {} +", "sort -o .flow/s x", "git diff --output=.flow/s",
    "find .flow -type f | xargs rm", "cp x .flow/s", "rm -rf .", "git clean -fdx",
    "python3 -c \"import shutil; shutil.rmtree('.flow')\"", "node -e \"require('fs').rmSync('.flow',{recursive:true})\"",
    "sh <<EOF\nrm -rf .flow\nEOF", "echo 'rm -rf .flow' | bash", "x=$(rm -rf .flow)",
    "pwsh -NoProfile -EncodedCommand " + enc("Remove-Item .flow -Recurse"), "cmd /c \"rd /s /q .flow\"",
  ]) assert.equal(p.bash(c).status, 2, c);
  // PowerShell: cmdlets and aliases, backslash and drive paths, -Path:, pipelines and script blocks.
  for (const c of [
    "Remove-Item .flow -Recurse -Force", "Remove-Item -Path .flow\\demo-flow\\state.json", `Remove-Item -LiteralPath '${p.proj}\\.flow' -Recurse`,
    "ri .flow\\s", "del .flow\\s", "rd .flow", "Set-Content -Path .flow\\s -Value x", "Set-Content .FLOW\\s x", "'x' | Out-File .flow\\s",
    "Add-Content -Path:.flow\\s x", "Clear-Content .flow\\s", "New-Item -ItemType File .flow\\x -Force", "Move-Item .flow x", "Rename-Item .flow x",
    "Copy-Item x -Destination .flow\\s", "Remove-Item .fl*", "Remove-Item * -Recurse -Force", ".fl`ow | Remove-Item",
    "Get-ChildItem .flow -Recurse | Remove-Item -Force", "& { Remove-Item .flow }", "1..3 | ForEach-Object { Remove-Item .flow\\$_ }",
    "Invoke-Expression 'Remove-Item .flow'", "'Remove-Item .flow' | pwsh -Command -", "powershell -enc " + enc("rm .flow"),
  ]) assert.equal(ps(c).status, 2, c);
  // Reading is fine, in either shell.
  for (const c of [
    "cat .flow/demo-flow/state.json | jq .run", "head -n 5 .flow/demo-flow/log.jsonl", "ls -la .flow", "grep -rn approve .flow",
    "rg step .flow", "tree .flow", "find .flow -name '*.json'", "sed -n 1,5p .flow/demo-flow/state.json", "awk 'NR<5' .flow/demo-flow/log.jsonl",
    "git status .flow", "git log -- .flow", "git diff .flow", "git add .flow", "cp .flow/demo-flow/state.json /tmp/backup.json",
    "ls .flow | xargs echo", "cat .flow\\demo-flow\\state.json",
  ]) assert.equal(p.bash(c).status, 0, c);
  for (const c of [
    "Get-Content .flow\\demo-flow\\state.json -Raw | ConvertFrom-Json", "Get-Content -LiteralPath .flow\\s", "Get-Content -Path:.flow\\s", "gc .flow\\s",
    "type .flow\\s", "Get-ChildItem .flow -Recurse", "dir .flow", "Select-String -Path .flow\\demo-flow\\log.jsonl -Pattern approve", "Test-Path .flow",
    "Copy-Item .flow\\s -Destination backup.json", "Remove-Item node_modules -Recurse",
  ]) assert.equal(ps(c).status, 0, c);
  // The edit tools see the state under any case.
  assert.equal(p.write(".FLOW/demo-flow/state.json").status, 2);
  assert.equal(p.hook("pre-tool-use", { tool_name: "apply_patch", tool_input: { input: "*** Begin Patch\n*** Update File: scratch/a\n*** Move to: .flow/demo-flow/state.json\n*** End Patch" } }).status, 2);
});

test("a line too deep or too costly to read is refused, not let through", () => {
  const p = project();
  p.cli("start", "spike", "--request", "try it");
  // Scripts nested past the reader's depth used to go unchecked.
  let deep = "rm -rf .flow";
  for (let i = 0; i < 10; i++) deep = `eval ${JSON.stringify(deep)}`;
  // Lines built to multiply the reading work used to run the hook into its timeout.
  const wide = `rm -rf .flow; ${"ssh ".repeat(400)}x`;
  const widePs = `Remove-Item .flow; ${"pwsh ".repeat(400)}x`;
  for (const c of [deep, wide, `${"ssh ".repeat(400)}x`]) {
    const t = Date.now();
    const r = p.bash(c);
    assert.equal(r.status, 2, c.slice(0, 80));
    assert.ok(Date.now() - t < 10000, "answered well inside a hook timeout");
  }
  assert.equal(p.hook("pre-tool-use", { tool_name: "PowerShell", tool_input: { command: widePs } }).status, 2);
  // Ordinary nesting is still read normally.
  assert.equal(p.bash("ssh host 'ls -la'").status, 0);
  assert.equal(p.bash("bash -c \"bash -c 'eval ls'\"").status, 0);
});

test("a tool hook that crashes refuses the call", () => {
  const p = project();
  // An unreadable payload field the hook does not expect: cwd must be a string.
  const r = p.hook("pre-tool-use", { cwd: 42, tool_name: "Bash", tool_input: { command: "ls" } });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /could not check this call/);
});

test("only the human approves, and the agent cannot switch its own rails off", () => {
  const p = project();
  toGate(p);
  const flow = path.join(p.skill, "scripts", "flow.mjs");
  // Every route to an approval from the agent's shell is blocked: flags first, any case, the hook
  // with a forged prompt, the MCP server answering its own elicitation, code that imports flow.mjs.
  for (const c of [
    `node ${flow} --by me approve`, `node "${flow}" REJECT`, `node ${flow.replace(/\//g, "\\")} unsuspend`,
    `echo '{"prompt":"approve"}' | node ${flow} hook user-prompt`, `node ${flow} mcp < answers.jsonl`,
    `node -e "import('${flow}').then((m) => m)"`, `bash -c 'node ${flow} approve'`,
  ]) assert.match(p.bash(c).stderr, /only the user can approve/, c);
  assert.match(p.cli("status").stdout, /waiting for the human/);
  // The rules and the hooks that enforce them change only while suspended.
  const rel = path.relative(p.proj, p.skill);
  assert.equal(p.write(path.join(p.skill, "profile.md")).status, 2);
  assert.equal(p.write(path.join(p.skill, "playbooks", "ship.md")).status, 2);
  assert.equal(p.bash(`sed -i 's/irreversible.*//' ${rel}/playbooks/ship.md`).status, 2);
  assert.equal(p.bash(`rm -rf ${rel}`).status, 2);
  assert.equal(p.bash("rm -rf .claude").status, 2);
  assert.equal(p.bash(`cat ${rel}/profile.md`).status, 0);
  const settings = path.join(p.proj, ".claude", "settings.json");
  const hookCmd = `node "${flow}" hook pre-tool-use`;
  fs.writeFileSync(settings, JSON.stringify({ permissions: { allow: [] }, hooks: { PreToolUse: [{ hooks: [{ type: "command", command: hookCmd }] }] } }, null, 2));
  const edit = (tool_input) => p.hook("pre-tool-use", { tool_name: "Edit", tool_input: { file_path: settings, ...tool_input } }).status;
  assert.equal(edit({ old_string: '"allow": []', new_string: '"allow": ["Bash(ls)"]' }), 0, "other settings may change");
  assert.equal(edit({ old_string: hookCmd, new_string: "true" }), 2);
  assert.equal(edit({ old_string: '"permissions"', new_string: '"disableAllHooks": true, "permissions"' }), 2);
  assert.equal(p.hook("pre-tool-use", { tool_name: "Write", tool_input: { file_path: settings, content: "{}" } }).status, 2);
  assert.equal(p.bash("echo '{}' > .claude/settings.json").status, 2);
  p.cli("suspend"); // the human's own terminal
  assert.equal(p.write(path.join(p.skill, "profile.md")).status, 0);
});

test("each guarded stage waits for its own gate", () => {
  const p = project();
  fs.writeFileSync(path.join(p.skill, "playbooks", "ship.md"), `---
id: ship
title: Ship
phase: any
lifecycle: any
kind: work
irreversible: [\${rollout}]
exits:
  - to: end
    when: rolled out
---

## Purpose

Roll out in stages.

## Steps

1. [human-gate] Approve the first stage.
2. [irreversible] Run \`\${rollout} --percent 1\`.
3. [human-gate] Approve widening.
4. [irreversible] Run \`\${rollout} --percent 50\`.

## Done when

- \`rollout status\` shows 50%.
`);
  p.cli("start", "ship", "--request", "roll out");
  p.cli("step", "1");
  p.hook("user-prompt", { prompt: "approve" });
  assert.equal(p.bash("rollout --percent 1").status, 0);
  p.cli("step", "2", "--evidence", "at 1%");
  assert.match(p.bash("rollout --percent 50").stderr, /belongs to step 4 and step 3 \[human-gate\] is not approved/);
  p.cli("step", "3");
  p.hook("user-prompt", { prompt: "approve" });
  assert.equal(p.bash("rollout --percent 50").status, 0);
});

test("checks decide which exits open", () => {
  const p = project();
  toGate(p);
  p.hook("user-prompt", { prompt: "approve" });
  p.cli("step", "3", "--evidence", "deployed");
  const fail = p.cli("finish", "--evidence", "url printed");
  assert.match(fail.stdout, /check FAIL: test -f ok\.txt/);
  assert.match(p.cli("exit", "end", "--because", "x").stderr, /only exits marked `on: fail` are open/);
  fs.writeFileSync(path.join(p.proj, "ok.txt"), "");
  assert.match(p.cli("finish", "--evidence", "url printed").stdout, /check pass/);
  assert.equal(p.cli("exit", "end", "--because", "deployed").status, 0);
  assert.match(p.cli("status").stdout, /No playbook is active/);
  assert.equal(fs.readdirSync(path.join(p.proj, ".flow", "demo-flow", "runs")).length, 1);
});

test("writes are limited to the active playbook's paths, and state is protected", () => {
  const p = project();
  p.cli("start", "spike", "--request", "try it");
  assert.match(p.write("src/app.js").stderr, /spike may only write scratch\/\*\*/);
  assert.equal(p.write("scratch/try.js").status, 0);
  assert.equal(p.write(".flow/demo-flow/state.json").status, 2);
  // Reading the state is fine; changing it is not.
  assert.equal(p.bash("cat .flow/demo-flow/state.json").status, 0);
  assert.equal(p.bash("jq .run .flow/demo-flow/state.json | head").status, 0);
  assert.equal(p.bash("rm -rf .flow").status, 2);
  assert.equal(p.bash("cat x > .flow/demo-flow/state.json").status, 2);
  // A paused run frees edits for other work; guarded commands stay blocked.
  p.cli("pause", "--note", "side task");
  assert.equal(p.write("src/app.js").status, 0);
  assert.equal(p.bash("npm run deploy").status, 2);
  p.cli("resume");
  assert.equal(p.write("src/app.js").status, 2);
});

test("strict rails block edits without a run; advisory rails block nothing", () => {
  const strict = project({ rails: "strict" });
  assert.match(strict.write("src/app.js").stderr, /no playbook is active/);
  const standard = project();
  assert.equal(standard.write("src/app.js").status, 0);
  const advisory = project({ rails: "advisory" });
  advisory.cli("start", "spike", "--request", "try it");
  assert.equal(advisory.bash("npm run deploy").status, 0);
});

test("stop is bounced once per state of progress, but allowed while waiting or paused", () => {
  const p = project();
  p.cli("start", "spike", "--request", "try it");
  const first = p.hook("stop", {});
  assert.equal(first.status, 0);
  assert.equal(JSON.parse(first.stdout).decision, "block");
  assert.match(JSON.parse(first.stdout).reason, /step 1 not recorded/);
  assert.equal(p.hook("stop", {}).stdout, "", "a second stop without progress is allowed");
  assert.equal(p.hook("stop", { stop_hook_active: true }).stdout, "");
  p.cli("pause", "--note", "need input");
  assert.equal(p.hook("stop", {}).stdout, "");
  const q = project();
  toGate(q);
  assert.equal(q.hook("stop", {}).stdout, "");
});

test("suspend turns the hooks off", () => {
  const p = project();
  p.cli("suspend");
  assert.equal(p.bash("npm run deploy").status, 0);
  p.cli("unsuspend");
  assert.equal(p.bash("npm run deploy").status, 2);
});

test("context is injected at session start and on every prompt during a run", () => {
  const p = project();
  const ctx = (r) => JSON.parse(r.stdout).hookSpecificOutput;
  const start = ctx(p.hook("session-start", { hook_event_name: "SessionStart" })).additionalContext;
  assert.match(start, /No playbook is active\. Use this workflow only when the user asks for it by name/);
  // Without a run, prompts get nothing, so unrelated work is not pushed onto the workflow.
  assert.equal(p.hook("user-prompt", { hook_event_name: "UserPromptSubmit", prompt: "fix the typo" }).stdout, "");
  assert.match(ctx(project({ rails: "strict" }).hook("user-prompt", { prompt: "x" })).additionalContext, /To work on a task with this workflow/);
  p.cli("start", "spike", "--request", "try it");
  const out = ctx(p.hook("user-prompt", { hook_event_name: "UserPromptSubmit", prompt: "how is it going" }));
  assert.equal(out.hookEventName, "UserPromptSubmit");
  assert.match(out.additionalContext, /Active playbook: spike \(0\/1 steps recorded\)/);
});

test("install writes hooks for each agent, and MCP only on request, idempotently", () => {
  const p = project();
  fs.mkdirSync(path.join(p.proj, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(p.proj, ".claude", "settings.json"), JSON.stringify({ permissions: { allow: ["Bash(ls)"] } }));
  assert.equal(p.cli("install", "--harness", "claude,codex,cursor").status, 0);
  assert.equal(fs.existsSync(path.join(p.proj, ".mcp.json")), false, "MCP is opt-in");
  p.cli("install", "--harness", "claude,codex,cursor", "--mcp");
  p.cli("install", "--harness", "claude,codex,cursor", "--mcp");
  const json = (f) => JSON.parse(fs.readFileSync(path.join(p.proj, f), "utf8"));
  const claude = json(".claude/settings.json");
  assert.deepEqual(claude.permissions, { allow: ["Bash(ls)"] });
  for (const ev of ["SessionStart", "UserPromptSubmit", "PreToolUse", "Stop"]) assert.equal(claude.hooks[ev].length, 1, ev);
  assert.equal(claude.hooks.PreToolUse[0].hooks[0].command, 'node "$CLAUDE_PROJECT_DIR/.claude/skills/demo-flow/scripts/flow.mjs" hook pre-tool-use');
  assert.equal(json(".codex/hooks.json").hooks.PreToolUse.length, 1);
  assert.equal(json(".cursor/hooks.json").hooks.preToolUse[0].command, 'node ".claude/skills/demo-flow/scripts/flow.mjs" hook pre-tool-use');
  assert.deepEqual(json(".mcp.json").mcpServers["demo-flow"], { command: "node", args: [".claude/skills/demo-flow/scripts/flow.mjs", "mcp"] });
  assert.ok(json(".cursor/mcp.json").mcpServers["demo-flow"]);
  const toml = fs.readFileSync(path.join(p.proj, ".codex", "config.toml"), "utf8");
  assert.equal(toml.match(/\[mcp_servers\."demo-flow"\]/g).length, 1);
  assert.equal(p.cli("install", "--harness", "vim").status, 2);
});

test("install covers Copilot, Antigravity, Qwen Code, Factory Droid and Windsurf in their own formats", () => {
  const p = project();
  const json = (f) => JSON.parse(fs.readFileSync(path.join(p.proj, f), "utf8"));
  const all = "copilot,antigravity,qwen,factory,windsurf";
  assert.equal(p.cli("install", "--harness", all, "--mcp").status, 0);
  assert.equal(p.cli("install", "--harness", all).status, 0);
  const cmd = (ev) => `node ".claude/skills/demo-flow/scripts/flow.mjs" hook ${ev}`;

  const copilot = json(".github/hooks/demo-flow.json");
  assert.equal(copilot.version, 1);
  for (const ev of ["SessionStart", "UserPromptSubmit", "PreToolUse", "Stop"]) assert.equal(copilot.hooks[ev].length, 1, ev);
  assert.deepEqual(copilot.hooks.PreToolUse[0], { type: "command", command: `${cmd("pre-tool-use")} --format copilot`, cwd: "." });

  // Antigravity runs hooks in .agents/, keyed by hook name; only tool events take a matcher.
  const agy = json(".agents/hooks.json")["demo-flow"];
  const agyCmd = (ev) => `node "../.claude/skills/demo-flow/scripts/flow.mjs" hook ${ev} --format antigravity`;
  assert.deepEqual(Object.keys(agy).sort(), ["PreInvocation", "PreToolUse", "Stop"]);
  assert.deepEqual(agy.PreToolUse, [{ matcher: ".*", hooks: [{ type: "command", command: agyCmd("pre-tool-use") }] }]);
  assert.deepEqual(agy.Stop, [{ type: "command", command: agyCmd("stop") }]);
  assert.equal(agy.PreInvocation[0].command, agyCmd("user-prompt"));

  const qwen = json(".qwen/settings.json");
  assert.equal(qwen.hooks.PreToolUse[0].hooks[0].command, 'node "$QWEN_PROJECT_DIR/.claude/skills/demo-flow/scripts/flow.mjs" hook pre-tool-use');
  assert.ok(qwen.mcpServers["demo-flow"]);

  assert.equal(json(".factory/settings.json").hooks.Stop.length, 1);

  const windsurf = json(".windsurf/hooks.json").hooks;
  assert.deepEqual(Object.keys(windsurf).sort(), ["pre_run_command", "pre_user_prompt", "pre_write_code"]);
  assert.deepEqual(windsurf.pre_run_command, [{ command: cmd("pre-tool-use"), show_output: false }]);
  assert.equal(windsurf.pre_write_code[0].command, cmd("pre-tool-use"));

  // Where a newer config file exists, hooks go there instead.
  const q = project();
  fs.mkdirSync(path.join(q.proj, ".factory"), { recursive: true });
  fs.writeFileSync(path.join(q.proj, ".factory", "hooks.json"), "{}");
  fs.mkdirSync(path.join(q.proj, ".devin"), { recursive: true });
  fs.writeFileSync(path.join(q.proj, ".devin", "hooks.json"), "{}");
  assert.equal(q.cli("install", "--harness", "factory,windsurf").status, 0);
  const qjson = (f) => JSON.parse(fs.readFileSync(path.join(q.proj, f), "utf8"));
  assert.equal(qjson(".factory/hooks.json").PreToolUse.length, 1, "Droid's hooks.json is keyed by event at the top level");
  assert.equal(qjson(".devin/hooks.json").hooks.pre_run_command.length, 1);
  assert.equal(fs.existsSync(path.join(q.proj, ".factory", "settings.json")), false);
  assert.equal(fs.existsSync(path.join(q.proj, ".windsurf")), false);
});

test("tool names and payloads of different agents are normalized", () => {
  const p = project();
  p.cli("start", "spike", "--request", "try it");
  const pre = (tool_name, tool_input) => p.hook("pre-tool-use", { tool_name, tool_input }).status;
  assert.equal(pre("Shell", { command: "npm run deploy" }), 2);
  assert.equal(pre("run_shell_command", { command: "npm run deploy" }), 2);
  assert.equal(pre("Bash", { command: ["bash", "-lc", "npm run deploy"] }), 2);
  assert.equal(pre("write_file", { file_path: "src/app.js" }), 2);
  assert.equal(pre("apply_patch", { input: "*** Begin Patch\n*** Update File: src/app.js\n@@\n*** End Patch" }), 2);
  assert.equal(pre("apply_patch", { input: "*** Begin Patch\n*** Add File: scratch/a.js\n*** End Patch" }), 0);
  assert.equal(pre("Read", { file_path: "src/app.js" }), 0);
  // Factory Droid.
  assert.equal(pre("Execute", { command: "npm run deploy" }), 2);
  assert.equal(pre("ApplyPatch", { patch: "*** Begin Patch\n*** Update File: src/app.js\n*** End Patch" }), 2);
  // Copilot CLI, as recorded in github/copilot-sdk test/snapshots/builtin_tools; arguments may arrive as a JSON string.
  assert.equal(pre("bash", { command: "npm run deploy", description: "Deploy" }), 2);
  assert.equal(pre("powershell", { command: "npm run deploy", description: "Deploy" }), 2);
  assert.equal(pre("create", { path: path.join(p.proj, "src/app.js"), file_text: "x" }), 2);
  assert.equal(pre("edit", { path: path.join(p.proj, "src/app.js"), old_str: "a", new_str: "b" }), 2);
  assert.equal(pre("edit", JSON.stringify({ path: "src/app.js", old_str: "a", new_str: "b" })), 2);
  assert.equal(pre("create", { path: path.join(p.proj, "scratch/a.js"), file_text: "x" }), 0);
  // Copilot CLI hooks (PascalCase, captured from 1.0.95): Claude-style names, and a patch edit as bare text.
  assert.equal(pre("Edit", "*** Begin Patch\n*** Add File: scratch/c.txt\n+new\n*** Update File: src/app.js\n@@\n-a\n+b\n*** End Patch\n"), 2);
  assert.equal(pre("Edit", "*** Begin Patch\n*** Add File: scratch/c.txt\n+new\n*** End Patch\n"), 0);
  // VS Code agent mode (tool schemas from microsoft/vscode).
  assert.equal(pre("run_in_terminal", { command: "npm run deploy", explanation: "x", goal: "x", mode: "sync" }), 2);
  assert.equal(pre("create_file", { filePath: "src/app.js", content: "x" }), 2);
  assert.equal(pre("replace_string_in_file", { filePath: "src/app.js", oldString: "a", newString: "b" }), 2);
  assert.equal(pre("insert_edit_into_file", { filePath: "src/app.js", code: "x", explanation: "x" }), 2);
  assert.equal(pre("edit_notebook_file", { filePath: "src/a.ipynb", cellId: "1", editType: "edit" }), 2);
  assert.equal(pre("multi_replace_string_in_file", { replacements: [{ filePath: "scratch/a.js" }, { filePath: "src/app.js" }] }), 2);
  assert.equal(pre("create_file", { filePath: "scratch/a.js", content: "x" }), 0);
});

test("Copilot gets a structured deny and a top-level additionalContext", () => {
  // Copilot CLI 1.0.95 shows the model only "hook exited with code 2" and drops stderr, and reads
  // session-start context only from a top-level additionalContext.
  const p = project();
  const hook = (event, input) => spawnSync(process.execPath, [path.join(p.skill, "scripts", "flow.mjs"), "hook", event, "--format", "copilot"], {
    cwd: p.proj, encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: "", FLOW_ROOT: "" }, input: JSON.stringify({ cwd: p.proj, ...input }),
  });
  const start = JSON.parse(hook("session-start", { hook_event_name: "SessionStart" }).stdout);
  assert.match(start.additionalContext, /No playbook is active/);
  assert.equal(start.hookSpecificOutput.additionalContext, start.additionalContext);
  const denied = hook("pre-tool-use", { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "npm run deploy" } });
  assert.equal(denied.status, 0);
  const out = JSON.parse(denied.stdout).hookSpecificOutput;
  assert.equal(out.permissionDecision, "deny");
  assert.match(out.permissionDecisionReason, /^\[demo-flow\] Blocked: `npm run deploy` is irreversible/);
  assert.equal(hook("pre-tool-use", { tool_name: "Bash", tool_input: { command: "ls" } }).stdout, "");
});

test("Antigravity payloads and decisions", () => {
  // Shapes captured from agy 1.3.3: no cwd or event name, workspacePaths and toolCall instead,
  // decisions only as JSON on stdout, PreInvocation before every model call.
  const p = project();
  const hook = (event, input) => spawnSync(process.execPath, [path.join(p.skill, "scripts", "flow.mjs"), "hook", event, "--format", "antigravity"], {
    cwd: path.join(p.proj, ".claude"), encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: "", FLOW_ROOT: "" },
    input: JSON.stringify({ conversationId: "c", modelName: "m", workspacePaths: [p.proj], ...input }),
  });
  const tool = (name, args) => JSON.parse(hook("pre-tool-use", { stepIdx: 2, toolCall: { name, args } }).stdout);
  p.cli("start", "spike", "--request", "try it");
  const allow = { decision: "allow" };
  assert.deepEqual(tool("run_command", { CommandLine: "ls", Cwd: p.proj }), allow, "an empty decision would deny");
  assert.equal(tool("run_command", { CommandLine: "rm .flow/demo-flow/state.json", Cwd: p.proj }).decision, "deny");
  assert.match(tool("write_to_file", { TargetFile: path.join(p.proj, "src/app.js"), CodeContent: "x" }).reason, /^\[demo-flow\] Blocked: playbook spike may only write/);
  assert.equal(tool("replace_file_content", { TargetFile: path.join(p.proj, "src/app.js") }).decision, "deny");
  assert.deepEqual(tool("write_to_file", { TargetFile: path.join(p.proj, "scratch/a.js"), CodeContent: "x" }), allow);
  assert.deepEqual(tool("view_file", { AbsolutePath: path.join(p.proj, "src/app.js") }), allow);

  const first = JSON.parse(hook("user-prompt", { invocationNum: 0, initialNumSteps: 1 }).stdout);
  assert.match(first.injectSteps[0].ephemeralMessage, /Active playbook: spike/);
  assert.deepEqual(JSON.parse(hook("user-prompt", { invocationNum: 1, initialNumSteps: 3 }).stdout), {});

  const stop = JSON.parse(hook("stop", { executionNum: 0, fullyIdle: true, terminationReason: "NO_TOOL_CALL" }).stdout);
  assert.equal(stop.decision, "continue");
  assert.deepEqual(JSON.parse(hook("stop", { executionNum: 1, fullyIdle: true }).stdout), {}, "bounced once per state of progress");

  // At a gate, the injected context sends the user to the terminal.
  const q = project();
  toGate(q);
  const qhook = (input) => spawnSync(process.execPath, [path.join(q.skill, "scripts", "flow.mjs"), "hook", "user-prompt", "--format", "antigravity"], {
    cwd: q.proj, encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: "", FLOW_ROOT: "" }, input: JSON.stringify({ workspacePaths: [q.proj], ...input }),
  });
  assert.match(JSON.parse(qhook({ invocationNum: 0 }).stdout).injectSteps[0].ephemeralMessage, /cannot see chat replies to a gate: ask the user to run `node .* approve`/);
});

test("Windsurf Cascade payloads are normalized", () => {
  const p = project();
  const cascade = (agent_action_name, tool_info) => p.hook(agent_action_name === "pre_user_prompt" ? "user-prompt" : "pre-tool-use", { agent_action_name, tool_info });
  assert.equal(cascade("pre_run_command", { command_line: "npm run deploy", cwd: p.proj }).status, 2);
  assert.equal(cascade("pre_run_command", { command_line: "ls", cwd: p.proj }).status, 0);
  assert.equal(toGate(p).status, 3);
  assert.equal(cascade("pre_write_code", { file_path: path.join(p.proj, ".flow", "demo-flow", "state.json"), edits: [] }).status, 2);
  assert.equal(cascade("pre_user_prompt", { user_prompt: "approve" }).status, 0);
  assert.match(p.cli("status").stdout, /approved/i);
});

// Minimal MCP client over the server's stdio.
function mcpSession(p, { elicitation, answer }) {
  const child = spawn(process.execPath, [path.join(p.skill, "scripts", "flow.mjs"), "mcp"], { cwd: p.proj, env: { ...process.env, CLAUDE_PROJECT_DIR: "", FLOW_ROOT: "" } });
  let buf = "";
  const waiting = new Map();
  const elicited = [];
  child.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const msg = JSON.parse(buf.slice(0, i));
      buf = buf.slice(i + 1);
      if (msg.method === "elicitation/create") {
        elicited.push(msg.params);
        child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: answer }) + "\n");
      } else waiting.get(msg.id)?.(msg);
    }
  });
  let id = 0;
  const call = (method, params) => new Promise((resolve) => { id += 1; waiting.set(id, resolve); child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"); });
  const tool = async (name, args = {}) => (await call("tools/call", { name, arguments: args })).result;
  return { child, call, tool, elicited, init: () => call("initialize", { protocolVersion: "2025-11-25", capabilities: elicitation ? { elicitation: { form: {} } } : {}, clientInfo: { name: "test", version: "0" } }) };
}

test("MCP server: tools drive the run and a human gate is answered through elicitation", async () => {
  const p = project();
  const s = mcpSession(p, { elicitation: true, answer: { action: "accept", content: { decision: "approve", note: "ship it" } } });
  try {
    const init = await s.init();
    assert.equal(init.result.serverInfo.name, "demo-flow");
    const tools = (await s.call("tools/list", {})).result.tools.map((t) => t.name);
    assert.ok(tools.includes("flow_step") && !tools.some((t) => /approve/.test(t)));
    assert.match((await s.tool("flow_exit", { to: "end", because: "x" })).content[0].text, /REFUSED/);
    await s.tool("flow_start", { playbook: "spike", request: "try it" });
    await s.tool("flow_step", { n: 1, evidence: "notes" });
    await s.tool("flow_finish", { evidence: "answer" });
    await s.tool("flow_exit", { to: "ship", because: "answered" });
    await s.tool("flow_step", { n: 1, evidence: "built" });
    const gate = await s.tool("flow_step", { n: 2 });
    assert.equal(s.elicited.length, 1);
    assert.match(s.elicited[0].message, /Confirm the deploy/);
    assert.match(gate.content[0].text, /The user approved step 2/);
    assert.match(p.cli("status").stdout, /approved by the user \(elicitation\): ship it/);
  } finally { s.child.kill(); }
});

test("MCP server: without elicitation the gate waits for the human", async () => {
  const p = project();
  const s = mcpSession(p, { elicitation: false });
  try {
    await s.init();
    await s.tool("flow_start", { playbook: "ship", request: "deploy" });
    await s.tool("flow_step", { n: 1, evidence: "built" });
    const gate = await s.tool("flow_step", { n: 2 });
    assert.equal(s.elicited.length, 0);
    assert.match(gate.content[0].text, /STOP\. Step 2 is a human gate/);
    assert.match(p.cli("status").stdout, /waiting for the human/);
  } finally { s.child.kill(); }
});

test("an invalid graph refuses to run but does not block the harness", () => {
  const p = project();
  fs.writeFileSync(path.join(p.skill, "playbooks", "ship.md"), SHIP.replace("to: spike", "to: nowhere"));
  assert.match(p.cli("start", "spike", "--request", "x").stderr, /graph is invalid/);
  assert.equal(p.bash("npm run deploy").status, 0);
  assert.match(p.hook("session-start", {}).stdout, /rails are off until it validates/);
});

// ---------- bindings: one skill, many repositories ----------

test("one skill copy runs in two projects with each project's own values", () => {
  const p = project();
  const other = fs.mkdtempSync(path.join(os.tmpdir(), "lg-other-"));
  fs.mkdirSync(path.join(other, ".git"));
  fs.mkdirSync(path.join(other, ".flow", "demo-flow"), { recursive: true });
  fs.writeFileSync(path.join(other, ".flow", "demo-flow", "project.md"), "---\nscratch: [tmp, notebooks]\nok-check: test -f ready\ndeploy: make ship\nrollout: rollout\n---\n");
  const flow = path.join(p.skill, "scripts", "flow.mjs");
  const env = { ...process.env, CLAUDE_PROJECT_DIR: "", FLOW_ROOT: "" };
  const cli = (...args) => spawnSync(process.execPath, [flow, ...args], { cwd: other, encoding: "utf8", env });
  const hook = (input) => spawnSync(process.execPath, [flow, "hook", "pre-tool-use"], { cwd: other, encoding: "utf8", env, input: JSON.stringify({ cwd: other, ...input }) });
  assert.equal(cli("start", "spike", "--request", "try it").status, 0);
  assert.match(cli("status").stdout, /Try it in `tmp, notebooks\/`/);
  assert.match(cli("status").stdout, /Bindings \(from \.flow\/demo-flow\/project\.md\): \$\{scratch\} = `tmp`, `notebooks`/);
  assert.equal(hook({ tool_name: "Write", tool_input: { file_path: "notebooks/a.ipynb" } }).status, 0);
  assert.match(hook({ tool_name: "Write", tool_input: { file_path: "scratch/a.js" } }).stderr, /may only write tmp\/\*\*, notebooks\/\*\*/);
  // The other project's guard is its own command, not the first project's.
  assert.equal(hook({ tool_name: "Bash", tool_input: { command: "npm run deploy" } }).status, 0);
  assert.equal(hook({ tool_name: "Bash", tool_input: { command: "make ship" } }).status, 2);
  // The first project, same skill files, keeps its own values.
  p.cli("start", "spike", "--request", "try it");
  assert.match(p.write("tmp/a.js").stderr, /may only write scratch\/\*\*/);
});

test("an unbound project cannot start a run, and says what to bind", () => {
  const p = project();
  fs.writeFileSync(path.join(p.proj, ".flow", "demo-flow", "project.md"), "---\nscratch: scratch\ndeploy: \"\"\n---\n");
  const start = p.cli("start", "spike", "--request", "try it");
  assert.equal(start.status, 1);
  assert.match(start.stderr, /has not bound deploy, ok-check, rollout; ask the user to write them in \.flow\/demo-flow\/project\.md/);
  const ctx = JSON.parse(p.hook("session-start", {}).stdout).hookSpecificOutput.additionalContext;
  assert.match(ctx, /has not bound deploy \(command that deploys\)/);
});

test("the project bindings are rails: the agent cannot change them unless the user suspends", () => {
  const p = project();
  const file = ".flow/demo-flow/project.md";
  assert.match(p.write(file).stderr, /project bindings .* are part of the rails/);
  assert.equal(p.bash(`echo 'deploy: true' >> ${file}`).status, 2);
  assert.equal(p.bash(`cat ${file}`).status, 0);
  p.cli("suspend");
  assert.equal(p.write(file).status, 0);
});

test("install writes a project skeleton for the bindings and never overwrites it", () => {
  const p = project();
  const file = path.join(p.proj, ".flow", "demo-flow", "project.md");
  fs.rmSync(file);
  const out = p.cli("install", "--harness", "claude");
  assert.match(out.stdout, /project: wrote \.flow\/demo-flow\/project\.md/);
  const text = fs.readFileSync(file, "utf8");
  assert.match(text, /# command that deploys\ndeploy: ""/);
  assert.match(p.cli("start", "spike", "--request", "x").stderr, /has not bound/);
  fs.writeFileSync(file, PROJECT);
  assert.doesNotMatch(p.cli("install", "--harness", "claude").stdout, /project: wrote/);
  assert.equal(fs.readFileSync(file, "utf8"), PROJECT);
});

test("while a guarded command's binding is unset, only reading commands run", () => {
  const p = project();
  fs.writeFileSync(path.join(p.proj, ".flow", "demo-flow", "project.md"), "---\nscratch: scratch\nok-check: test -f ok.txt\ndeploy: \"\"\nrollout: rollout\n---\n");
  assert.match(p.bash("pnpm release").stderr, /use \$\{deploy\}, which \.flow\/demo-flow\/project\.md does not bind/);
  assert.equal(p.bash("make build").status, 2);
  assert.equal(p.bash("cat README.md | grep x").status, 0);
  assert.equal(p.bash("git status").status, 0);
  assert.equal(p.bash("ls > out.txt").status, 2);
  assert.equal(p.bash(`node ${path.join(p.skill, "scripts", "flow.mjs")} status`).status, 0);
  // Edits are not guarded commands; under standard rails they stay free without a run.
  assert.equal(p.write("src/app.js").status, 0);
  p.cli("suspend");
  assert.equal(p.bash("make build").status, 0);
});
