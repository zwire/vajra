// What the agent may not touch: the run state in .flow/, the rails (the skill and the agents' hook
// settings) and the commands only the human may run. Part of the security boundary of the rails:
// every check here fails closed when unsure.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { shellCommands, programName, commandStart } from "./shell.mjs";

// Whether code for an interpreter names the run state or the rails: any mention counts, as it
// can open any path. ctx = { root, skillDir }.
export function codeTouchesRails(text, ctx) {
  const t = norm(text);
  const rel = norm(path.relative(ctx.root, ctx.skillDir));
  return /\.flow/.test(t) || /flow\.mjs/.test(t) || (rel !== "" && t.includes(rel)) || HOOK_CONFIGS.some((f) => t.includes(f)) || DISABLES_HOOKS.test(text);
}

// ---------- shell access to the run state and to the human-only commands ----------
// Reading .flow/ is harmless (the Read tool may do it too); changing it, or running the commands
// only the human may run, must not happen from the agent's shell. Checked on every reading of
// the line (POSIX shell, and PowerShell where it may run), any case, either slash.
const STATE_PATH = /(^|[/=:,])\.flow(\/|$)/;
const norm = (t) => t.replace(/\\/g, "/").toLowerCase();
const mentionsState = (t) => /\.flow/i.test(t);

// A glob segment that could expand to .flow: `.f*`, `.fl?w`, and in PowerShell a bare `*`
// (its wildcards match dotfiles).
function globHitsState(seg, ps) {
  if (!/[*?[]/.test(seg) || (!ps && !seg.startsWith("."))) return false;
  let re = "";
  for (let i = 0; i < seg.length; i++) {
    const c = seg[i];
    if (c === "*") re += ".*";
    else if (c === "?") re += ".";
    else if (c === "[") { const e = seg.indexOf("]", i + 1); if (e < 0) re += "\\["; else { re += `[${seg.slice(i + 1, e).replace(/^!/, "^").replace(/\\/g, "\\\\")}]`; i = e; } }
    else re += c.replace(/[.+^${}()|\\]/g, "\\$&");
  }
  try { return new RegExp(`^${re}$`).test(".flow"); } catch { return true; }
}
// A word that names .flow, or a glob that could expand to it. A dotted glob (`.f*`) counts wherever
// it sits; PowerShell's bare `*` only where it lists the project root itself, so
// `Remove-Item build\* -Recurse` does not count. ctx = { root, cwd } resolves a prefix like `..\proj`.
function isStateWord(t, ps, ctx) {
  const n = norm(t);
  if (STATE_PATH.test(n)) return true;
  return n.replace(/^-[a-z]+:/, "").split(/[=,]/).some((part) => {
    const segs = part.split("/");
    return segs.some((seg, i) => {
      if (!globHitsState(seg, ps)) return false;
      if (seg.startsWith(".")) return true;
      const prefix = segs.slice(0, i).join("/");
      return prefix === "" || prefix === "." || (!!ctx && samePath(path.resolve(ctx.cwd, prefix), ctx.root));
    });
  });
}
// A plain path argument, as opposed to an option value, a script or a sentence.
const purePath = (t) => !/^-/.test(t) && !/\s/.test(t) && STATE_PATH.test(norm(t));

// Programs that only read the files they are given, with the flags that make them write or run code.
const READERS = new Map(Object.entries({
  cat: null, head: null, tail: null, less: /^(-o|-O|--log-file|--LOG-FILE)/, more: null, ls: null, wc: null, grep: null, egrep: null, fgrep: null,
  rg: /^--pre/, jq: null, stat: null, file: null, diff: null, cmp: null, tree: null, du: null, sort: /^(-o|--output)/, uniq: null, cut: null,
  column: null, od: null, xxd: null, hexdump: null, strings: null, md5sum: null, sha1sum: null, sha256sum: null, shasum: null, type: null,
  find: /^-(delete|exec|execdir|ok|okdir|fprint|fprint0|fprintf|fls)$/, sed: /^(-i|--in-place|-I)/, awk: /^(-i|--in-place)/, gawk: /^(-i|--in-place)/,
  dir: null, findstr: null, "get-content": null, gc: null, "get-childitem": null, gci: null, "select-string": null, sls: null, "test-path": null,
  "get-item": null, gi: null, "get-itemproperty": null, gp: null, "resolve-path": null, rvpa: null, "format-hex": null, fhx: null, "get-filehash": null,
}));
// These take a script that could write, so a .flow mention outside a plain path argument counts as a write.
const SCRIPTED = new Set(["sed", "awk", "gawk", "less"]);
const OUTPUT_FLAG = /^(-o|--output|--output-file|--log-file|-outfile)$/i;
const GIT_READS = new Set(["add", "commit", "log", "show", "diff", "status", "blame", "ls-files", "ls-tree", "grep", "cat-file", "check-ignore", "rev-parse", "describe", "shortlog"]);
const INTERPRETERS = /^(python\d*(\.\d+)?|node|nodejs|deno|bun|ruby|perl|php|osascript|lua|tclsh)$/;
const HUMAN_ONLY = new Set(["approve", "reject", "suspend", "unsuspend", "hook", "mcp"]);

// The program a simple command runs and its arguments, past assignments and wrappers like sudo.
function head(w) {
  const k = commandStart(w);
  return { k, name: programName(w[k].text), args: w.slice(k + 1) };
}
// The first argument that is not a flag: git's subcommand.
const subcommand = (args) => args.find((x) => !/^-/.test(x.text))?.text;
// A reader with no flag that could make it write or run code.
const pureReader = (name) => READERS.has(name) && !READERS.get(name);
// git subcommands that leave the working tree alone (`git rm --cached` only changes the index).
const gitReads = (args) => GIT_READS.has(subcommand(args)) || (subcommand(args) === "rm" && args.some((x) => x.text === "--cached"));
// Programs whose arguments are text, not files: only their redirections write.
const DATA_PROGRAMS = new Set(["echo", "printf", "write-output", "write-host"]);
// Option values that leave a path out (`--exclude=.flow`, `--exclude-dir .flow`): naming .flow
// there keeps it untouched. Programs that delete or move do not get this.
const EXCLUDE_EQ = /^--?[\w-]*(exclude|ignore)[\w-]*=/i;
const EXCLUDE_FLAG = /^--(exclude|exclude-dir|ignore|ignore-pattern|ignore-path)$/i;
const withoutExcluded = (args) => args.filter((x, j) => !EXCLUDE_EQ.test(x.text) && !EXCLUDE_FLAG.test(args[j - 1]?.text || ""));
// PowerShell cmdlets that write text to a path: only the path counts (`-Path`, `-LiteralPath`,
// `-FilePath`, `-Name`, or the first operand), never the text (`Add-Content .gitignore ".flow/x"`).
// Empty when the path is not given, so it comes from the pipeline.
const CONTENT_WRITERS = /^(set-content|sc|add-content|ac|out-file|new-item|ni)$/;
const PATH_PARAM = /^-(path|literalpath|lp|pspath|filepath|name)(:|$)/i;
const SWITCH = /^-(force|nonewline|passthru|append|whatif|confirm|noclobber|asbytestream|recurse)$/i;
function contentTargets(args) {
  const out = [];
  for (const [j, x] of args.entries()) if (PATH_PARAM.test(x.text)) { const v = /:/.test(x.text) ? x : args[j + 1]; if (v) out.push(v); }
  const first = args.find((x, j) => !/^-/.test(x.text) && !(/^-/.test(args[j - 1]?.text || "") && !SWITCH.test(args[j - 1].text)));
  if (first && !out.includes(first)) out.push(first);
  return out;
}
// Copying only writes its destination: the last operand, or the value of -t / -Destination.
// undefined when the program does not copy, null when the destination cannot be told.
function copyDestination(name, args) {
  if (/^(copy-item|cpi|copy)$/.test(name)) {
    const at = args.findIndex((x) => /^-d(e(s(t(i(n(a(t(i(o(n)?)?)?)?)?)?)?)?)?)?$/i.test(x.text));
    return at >= 0 ? args[at + 1] ?? null : args.filter((x) => !/^-/.test(x.text)).pop() ?? null;
  }
  if (!/^(cp|rsync|scp)$/.test(name)) return undefined;
  if (args.some((x) => /^(-t|--target-directory)/.test(x.text))) return null;
  return args.filter((x) => !/^-/.test(x.text)).pop() ?? null;
}

function commandViolation(w, ctx) {
  const { name, args } = head(w);
  const flowAt = w.findIndex((x) => programName(x.text) === "flow.mjs");
  if (flowAt >= 0 && w.slice(flowAt + 1).some((x) => HUMAN_ONLY.has(x.text.toLowerCase()))) return "human";
  // Code that loads flow.mjs itself could call approve() or answer a gate.
  if (INTERPRETERS.test(name) && args.some((x) => /flow\.mjs/i.test(x.text) && programName(x.text) !== "flow.mjs")) return "human";
  if (name === "git" && subcommand(args) === "clean" && args.some((x) => /^-[a-z]*[xX]/.test(x.text)) && !args.some((x) => /^(-[a-z]*n|--dry-run)$/.test(x.text))) return "clean";
  if (w.some((x) => x.redir && isStateWord(x.text, w.ps, ctx))) return "state";
  if (DATA_PROGRAMS.has(name)) return null;
  // Interpreter code can open any path, so any mention of .flow in its arguments counts.
  if (INTERPRETERS.test(name)) return args.some((x) => mentionsState(x.text)) ? "state" : null;
  const dest = copyDestination(name, args);
  if (dest !== undefined) {
    // Copying out of .flow/ only reads it; the destination must not be in it.
    if (!dest || isStateWord(dest.text, w.ps, ctx)) return args.some((x) => isStateWord(x.text, w.ps, ctx)) ? "state" : null;
    return args.some((x) => x !== dest && mentionsState(x.text) && STATE_PATH.test(norm(x.text)) && !purePath(x.text.replace(/^-(path|literalpath|lp):/i, ""))) ? "state" : null;
  }
  const deletes = /^(remove-item|rm|ri|del|erase|rd|rmdir|unlink|shred|clear-content|clc|move-item|mi|mv|move|rename-item|rni|ren)$/.test(name);
  const content = w.ps && CONTENT_WRITERS.test(name) ? contentTargets(args) : [];
  if (content.length) return content.some((x) => isStateWord(x.text, w.ps, ctx)) ? "state" : null;
  const targets = deletes ? args : withoutExcluded(args);
  const reader = READERS.has(name) ? READERS.get(name) : name === "git" && gitReads(args) ? /^--output/ : undefined;
  if (reader === undefined) return targets.some((x) => isStateWord(x.text, w.ps && deletes, ctx)) ? "state" : null;
  if (!targets.some((x) => mentionsState(x.text))) return null;
  if (reader && args.some((x) => reader.test(x.text))) return "state";
  for (const [j, x] of args.entries()) {
    if (!targets.includes(x)) continue;
    if (!mentionsState(x.text)) continue;
    const value = x.text.replace(/^-(path|literalpath|lp):/i, "");
    if (STATE_PATH.test(norm(value)) && (!purePath(value) || OUTPUT_FLAG.test(args[j - 1]?.text || ""))) return "state";
    if (SCRIPTED.has(name) && !purePath(value)) return "state";
  }
  return null;
}

// The rails' own definition: the skill (playbooks, profile, these scripts) and the agents' hook
// settings. They change only while the human has suspended the rails, so the agent cannot switch
// its own rails off (rails: advisory, a deleted guard, a removed hook, disableAllHooks).
// Files whose settings run or switch off the hooks: Claude Code's (which Copilot reads too), Codex's
// and Copilot's own settings (they can hold hooks and disableAllHooks). VS Code's settings can turn
// hooks off too (chat.useHooks) but are read often, so code that merely names them is not refused.
const HOOK_CONFIGS = [".claude/settings.json", ".claude/settings.local.json", ".codex/hooks.json", ".codex/config.toml", ".github/copilot/settings.json", ".github/copilot/settings.local.json"];
export function railsPaths(root, skillDir) {
  const configs = [...HOOK_CONFIGS, ".vscode/settings.json", `.github/hooks/${path.basename(skillDir)}.json`].map((f) => path.join(root, f));
  configs.push(...[".claude/settings.json", ".codex/config.toml", ".copilot/settings.json"].map((f) => path.join(os.homedir(), f)));
  return { skill: skillDir, configs, state: path.join(root, ".flow") };
}
// Paths compared as the most permissive file system would: any case, either slash.
export const samePath = (a, b) => norm(a) === norm(b);
export const inside = (p, dir) => samePath(p, dir) || norm(p).startsWith(norm(dir).replace(/\/$/, "") + "/");
// Hook settings may change except where an edit drops a flow.mjs hook or turns hooks off.
const DISABLES_HOOKS = /disableAllHooks|codex_hooks\s*=\s*false|chat\.useHooks["']?\s*[:=]\s*false/i;
// Codex: hooks = false under [features] (or features.hooks = false).
const TOML_OFF = /\bhooks\s*=\s*false\b/;
const DELETERS = /^(rm|rmdir|unlink|shred|mv|move|remove-item|ri|del|erase|rd|move-item|mi|rename-item|rni)$/;

function railsViolation(w, ctx) {
  const { k, name, args } = head(w);
  const rp = railsPaths(ctx.root, ctx.skillDir);
  const resolve = (t) => path.resolve(ctx.cwd, t.replace(/^-[a-z]+:/i, "").replace(/^~(?=\/|\\|$)/, os.homedir()));
  // Deleting or moving a directory that holds the state or the rails.
  if (DELETERS.test(name)) {
    for (const x of args) {
      if (/^-/.test(x.text) || /[*?[]/.test(x.text)) continue;
      const p = resolve(x.text);
      if ([rp.state, rp.skill, ...rp.configs].some((q) => inside(q, p))) return inside(rp.state, p) && !inside(rp.skill, p) ? "state" : "rails";
    }
  }
  if (pureReader(name)) return null;
  if (name === "git" && gitReads(args)) return null;
  if (INTERPRETERS.test(name)) {
    // Interpreter code (not the script it runs) that names the rails could rewrite them.
    const rel = norm(path.relative(ctx.root, rp.skill));
    return args.some((x) => /\s|[(;]/.test(x.text) && (norm(x.text).includes(rel) || HOOK_CONFIGS.some((f) => norm(x.text).includes(f)) || DISABLES_HOOKS.test(x.text))) ? "rails" : null;
  }
  const dest = copyDestination(name, args);
  const content = w.ps && CONTENT_WRITERS.test(name) ? contentTargets(args) : [];
  const redirs = args.filter((x) => x.redir);
  const named = DATA_PROGRAMS.has(name) ? redirs : dest ? [dest, ...redirs] : content.length ? [...content, ...redirs] : DELETERS.test(name) ? args : withoutExcluded(args);
  for (const x of [...named, ...w.slice(0, k)]) {
    if (programName(x.text) === "flow.mjs" || /\s/.test(x.text) || (!x.redir && /^-/.test(x.text) && !/^-[a-z]+:/i.test(x.text))) continue;
    const p = resolve(x.text);
    if (inside(p, rp.skill) || rp.configs.some((q) => samePath(q, p))) return "rails";
  }
  return null;
}

// Commands that change whatever is piped into them (`find .flow | xargs rm`, `gci .flow | Remove-Item`).
// A content cmdlet given its own path writes the piped text there; tee and Copy-Item only write
// their own target, which the command's own check covers.
const PIPE_WRITERS = /^(xargs|parallel|remove-item|ri|rm|del|erase|rd|rmdir|move-item|mi|mv|move|rename-item|rni|set-content|sc|add-content|ac|clear-content|clc|out-file|new-item|ni)$/;

// What a shell line would do that the agent may not: "human" (a human-only command), "rails",
// "clean" (git clean -x), "state" (change .flow/), "complex" (past what the reader follows), or
// null. ctx = { root, cwd, skillDir } adds the rails check; without it only the state is checked.
export function shellViolation(command, ps, ctx) {
  const { cmds, failed, complex } = shellCommands(command, { ps });
  if (complex) return "complex";
  const found = new Set(cmds.flatMap((w) => [commandViolation(w, ctx), ctx && railsViolation(w, ctx)]).filter(Boolean));
  const pipeWriter = (w) => {
    const { k, name, args } = head(w);
    if (!PIPE_WRITERS.test(name)) return false;
    if (CONTENT_WRITERS.test(name) && contentTargets(args).length) return false;
    if (!/^(xargs|parallel)$/.test(name)) return true;
    // xargs runs a program on what it reads: only readers (and echo) leave .flow/ alone.
    let j = k + 1;
    while (j < w.length && /^-/.test(w[j].text)) j += /^-[IndPLsEa]$/.test(w[j].text) ? 2 : 1;
    const prog = j < w.length ? programName(w[j].text) : "echo";
    return !pureReader(prog) && !["echo", "printf"].includes(prog);
  };
  const statePiped = cmds.some((w) => w.piped && pipeWriter(w)) && cmds.some((w) => w.some((x) => isStateWord(x.text, w.ps, ctx)));
  if (statePiped) found.add("state");
  if (failed) {
    // Unreadable as shell: fall back to the raw text, conservatively.
    if (/flow\.mjs["']?\s+(.*\s)?(approve|reject|suspend|unsuspend|hook|mcp)\b/i.test(command)) found.add("human");
    if (/(^|[\s'"=:(/\\,])\.flow([\\/\s'")]|$)/i.test(command)) found.add("state");
  }
  if (failed && ctx && (/disableAllHooks/i.test(command) || norm(command).includes(norm(path.relative(ctx.root, ctx.skillDir))))) found.add("rails");
  return ["human", "rails", "clean", "state"].find((v) => found.has(v)) || null;
}

// Whether an edit of a hook settings file removes a flow.mjs hook or turns hooks off.
export function dropsHooks(abs, act) {
  const { removed, added, whole } = act.change;
  const off = (t) => DISABLES_HOOKS.test(t) || (/\.toml$/i.test(abs) && TOML_OFF.test(t));
  if (off(added) || off(whole ?? "")) return true;
  // A hook command taken out must come back in the same edit: re-indenting or editing next to it is fine.
  const hookCommands = (t) => [...t.matchAll(/[^"'\n]*flow\.mjs[^"'\n]*/g)].map((m) => m[0].trim());
  if (hookCommands(removed).some((c) => !added.includes(c))) return true;
  if (whole === undefined) return false;
  let before = "";
  try { before = fs.readFileSync(abs, "utf8"); } catch { return false; }
  return hookCommands(before).some((c) => !whole.includes(c));
}
