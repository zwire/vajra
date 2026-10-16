// Reading the agent's tool calls for the hooks of flow.mjs: what a shell line would run, in POSIX
// shell and PowerShell, what an edit changes, and whether either touches the run state in .flow/,
// the rails (the skill and the agents' hook settings) or the commands only the human may run.
// This is the security boundary of the rails: every check here fails closed when unsure.
// No dependencies: Node 18+ only. Part of the runtime copied into every generated skill.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { commandMatches } from "./validate.mjs";

// ---------- shell commands (flow.mjs checks guards and the run state against these) ----------
// A small reader for POSIX shells and PowerShell: splits a command line into the simple commands
// it would run, with their words unquoted. Text that is only data (quoted arguments, comments,
// heredoc bodies) stays inside one word or is dropped, while code the shell would run from inside
// it is read as commands of its own: $(...), `...` and <(...); the script of `sh -c`, `eval`,
// `ssh`, `watch`, `pwsh -Command`, `pwsh -EncodedCommand`, `cmd /c`, `Invoke-Expression` and
// `Start-Process`; and heredocs or pipes that feed a shell its script on stdin.
// Each command is an array of { text, quoted, redir } words; `ps` on the array marks PowerShell.
const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh", "fish", "su"]);
const POWERSHELLS = new Set(["pwsh", "powershell"]);
const WRAPPERS = new Set(["sudo", "env", "exec", "nohup", "command", "time", "nice", "doas", "&", "."]);
const KEYWORDS = new Set(["if", "then", "else", "elif", "do", "while", "until", "!", "{", "}", "time"]);
// Past these limits a line is not read further but refused as too complex: scripts nested deeper
// than MAX_DEPTH would otherwise go unchecked, and a line built to multiply the work (`ssh ssh ...`)
// would run the hook into its timeout, which most agents treat as "allow".
const MAX_DEPTH = 8;
const MAX_READS = 500;
const MAX_CHARS = 4_000_000;
export class TooComplex extends Error {}

// The program a word names, as the shell would look it up: no directory, no .exe, any case.
export const programName = (t) => t.replace(/\\/g, "/").split("/").pop().toLowerCase().replace(/\.exe$/, "");

// Index of the first word that is the program itself, past assignments and wrappers like sudo.
export function commandStart(w) {
  let k = 0;
  while (k < w.length - 1 && (/^\w+=/.test(w[k].text) || (k > 0 && /^-/.test(w[k].text)) || WRAPPERS.has(programName(w[k].text)))) k++;
  return k;
}

function closing(s, i, open, close, esc) {
  // i is just past `open`; returns the index of the matching `close`, skipping quotes and escapes.
  for (let depth = 1; i < s.length; i++) {
    const c = s[i];
    if (c === esc) i++;
    else if (c === "'") { i = s.indexOf("'", i + 1); if (i < 0) break; }
    else if (c === '"') { for (i++; i < s.length && s[i] !== '"'; i++) if (s[i] === esc) i++; }
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return i;
  }
  throw new Error("unclosed " + open);
}

// Commands substituted inside double quotes, here-strings or an unquoted heredoc body.
function substitutions(s, nested, ps) {
  const esc = ps ? "`" : "\\";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === esc) i++;
    else if (s[i] === "$" && s[i + 1] === "(") { const e = closing(s, i + 2, "(", ")", esc); nested.push({ text: s.slice(i + 2, e), ps }); i = e; }
    else if (!ps && s[i] === "`") { const e = s.indexOf("`", i + 1); if (e < 0) throw new Error("unclosed `"); nested.push({ text: s.slice(i + 1, e), ps }); i = e; }
  }
}

function decodeEncodedCommand(b64) {
  try { return Buffer.from(b64, "base64").toString("utf16le"); } catch { return ""; }
}

function tokenize(s, ps, nested, bodies) {
  const cmds = [], heredocs = [];
  let words = [], word = null, redir = false, piped = false;
  const flush = () => { if (word) { words.push(word); word = null; } };
  const end = (pipe = false) => { flush(); if (words.length) { words.piped = piped; cmds.push(words); } words = []; redir = false; piped = pipe; };
  const add = (t, quoted) => { word ||= { text: "", quoted: false, redir }; word.text += t; word.quoted ||= quoted; redir = false; };
  const esc = ps ? "`" : "\\";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\r") continue;
    if (c === "\n") {
      end();
      for (const h of heredocs) {
        const lines = [];
        let j = i + 1;
        for (;;) {
          const nl = s.indexOf("\n", j), line = s.slice(j, nl < 0 ? s.length : nl).replace(/\r$/, "");
          j = nl < 0 ? s.length : nl + 1;
          if ((h.tabs ? line.replace(/^\t+/, "") : line) === h.delim) break;
          lines.push(line);
          if (nl < 0) break;
        }
        bodies.push(lines.join("\n"));
        if (!h.quoted) substitutions(bodies[bodies.length - 1], nested, false);
        i = j - 1;
      }
      heredocs.length = 0;
    } else if (c === " " || c === "\t") flush();
    else if (ps && c === "<" && s[i + 1] === "#") { const e = s.indexOf("#>", i + 2); if (e < 0) throw new Error("unclosed <#"); i = e + 1; }
    else if (c === "#" && !word) { const nl = s.indexOf("\n", i); i = (nl < 0 ? s.length : nl) - 1; }
    else if (c === esc) { if (s[i + 1] !== "\n") add(s[i + 1] ?? "", false); i++; }
    else if (ps && c === "@" && (s[i + 1] === '"' || s[i + 1] === "'") && /^\r?\n/.test(s.slice(i + 2))) {
      // PowerShell here-string: data up to a line that starts with "@ or '@.
      const q = s[i + 1], e = s.indexOf(`\n${q}@`, i + 2);
      if (e < 0) throw new Error("unclosed here-string");
      const t = s.slice(s.indexOf("\n", i) + 1, e).replace(/\r$/, "");
      if (q === '"') substitutions(t, nested, true);
      add(t, true); i = e + 2;
    } else if (c === "'") {
      let t = "", j = i + 1;
      for (;; j++) {
        const e = s.indexOf("'", j);
        if (e < 0) throw new Error("unclosed '");
        t += s.slice(j, e);
        if (ps && s[e + 1] === "'") { t += "'"; j = e + 1; continue; }
        j = e; break;
      }
      add(t, true); i = j;
    } else if (c === '"') {
      let t = "", raw = "", j = i + 1;
      for (; j < s.length; j++) {
        if (s[j] === '"') { if (ps && s[j + 1] === '"') { t += '"'; raw += '""'; j++; continue; } break; }
        if (s[j] === esc && (ps || '"\\$`\n'.includes(s[j + 1]))) { t += s[j + 1]; raw += s[j] + s[j + 1]; j++; }
        else if (s[j] === "$" && s[j + 1] === "(") { const e = closing(s, j + 2, "(", ")", esc); t += s.slice(j, e + 1); raw += s.slice(j, e + 1); j = e; }
        else if (!ps && s[j] === "`") { const e = s.indexOf("`", j + 1); if (e < 0) throw new Error("unclosed `"); t += s.slice(j, e + 1); raw += s.slice(j, e + 1); j = e; }
        else { t += s[j]; raw += s[j]; }
      }
      if (j >= s.length) throw new Error('unclosed "');
      substitutions(raw, nested, ps);
      add(t, true); i = j;
    } else if ((c === "$" || (ps && c === "@")) && s[i + 1] === "(") {
      const e = closing(s, i + 2, "(", ")", esc); nested.push({ text: s.slice(i + 2, e), ps }); add(s.slice(i, e + 1), false); i = e;
    } else if (!ps && c === "`") { const e = s.indexOf("`", i + 1); if (e < 0) throw new Error("unclosed `"); nested.push({ text: s.slice(i + 1, e), ps }); add(s.slice(i, e + 1), false); i = e; }
    else if (!ps && (c === "<" || c === ">") && s[i + 1] === "(") { const e = closing(s, i + 2, "(", ")", esc); nested.push({ text: s.slice(i + 2, e), ps }); flush(); i = e; }
    else if (c === "<" || c === ">") {
      if (word && !word.quoted && (/^\d+$/.test(word.text) || (ps && word.text === "*"))) word = null; // 2>&1, *>: the stream is not a word
      flush();
      const op = s.slice(i).match(/^(<<-|<<<|<<|<>|>>|>\||[<>]&?|&?>>?)/)[0];
      i += op.length - 1;
      if (!ps && (op === "<<" || op === "<<-")) {
        const m = s.slice(i + 1).match(/^[ \t]*(?:'([^']*)'|"([^"]*)"|\\?([^\s;&|<>()]+))/);
        if (!m) throw new Error("heredoc without delimiter");
        heredocs.push({ delim: m[1] ?? m[2] ?? m[3], quoted: m[1] !== undefined || m[2] !== undefined || m[0].includes("\\"), tabs: op === "<<-" });
        i += m[0].length;
      } else redir = true;
    } else if (!ps && c === "&" && s[i + 1] === ">") { flush(); i += s[i + 2] === ">" ? 2 : 1; redir = true; }
    else if (c === "|" && s[i + 1] === "|") { end(); i++; }
    else if (c === "|") { end(true); if (s[i + 1] === "&") i++; }
    else if (";&|()".includes(c) || (ps && "{}".includes(c))) end();
    else add(c, false);
  }
  end();
  return cmds;
}

function readShell(s, depth, ps, ctx) {
  if (++ctx.reads > MAX_READS) throw new TooComplex("too many nested scripts");
  const nested = [], bodies = [];
  const out = [];
  for (let w of tokenize(s, ps, nested, bodies)) {
    while (w.length && !w[0].quoted && (ps ? ["&", "."].includes(w[0].text) : KEYWORDS.has(w[0].text))) w = w.slice(1);
    if (!w.length) continue;
    const piped = w.piped;
    w.ps = ps;
    w.piped = piped;
    out.push(w);
    const rest = (k) => w.slice(k).map((x) => x.text).join(" ");
    for (let k = 0; k < w.length; k++) {
      const name = programName(w[k].text);
      if (SHELLS.has(name)) {
        const c = w.findIndex((x, j) => j > k && /^-[a-z]*c[a-z]*$/i.test(x.text));
        if (c > 0 && w[c + 1]) nested.push({ text: w[c + 1].text, ps: false });
      } else if (POWERSHELLS.has(name)) {
        // Every argument may be the script (-Command, or positional for powershell.exe); an encoded one is decoded.
        nested.push({ text: rest(k + 1), ps: true });
        for (let j = k + 1; j < w.length - 1; j++) {
          if (/^[-/](e|ec|en[a-z]*)$/i.test(w[j].text)) nested.push({ text: decodeEncodedCommand(w[j + 1].text), ps: true });
        }
      } else if (name === "cmd" && w.slice(k + 1).some((x) => /^\/[ck]$/i.test(x.text))) {
        nested.push({ text: rest(w.findIndex((x, j) => j > k && /^\/[ck]$/i.test(x.text)) + 1), ps: true });
      }
    }
    const head = programName(w[commandStart(w)].text);
    if (head === "eval" || head === "watch") nested.push({ text: rest(commandStart(w) + 1), ps });
    if (["invoke-expression", "iex", "start-process", "saps", "start", "invoke-command", "icm"].includes(head)) {
      nested.push({ text: rest(commandStart(w) + 1), ps: true });
      // Start-Process npm -ArgumentList 'run deploy' runs `npm run deploy`.
      nested.push({ text: w.slice(commandStart(w) + 1).filter((x) => !/^-/.test(x.text)).map((x) => x.text.replace(/,/g, " ")).join(" "), ps: true });
    }
    if (head === "ssh") for (let k = 1; k < w.length; k++) nested.push({ text: rest(k), ps });
  }
  // A shell reading its script from stdin (`bash <<EOF`, `cat x | sh`, `bash <<< "..."`,
  // `"..." | pwsh -Command -`) runs whatever the line feeds it: heredoc bodies and the other
  // commands' arguments become code.
  for (const w of out) {
    const k = commandStart(w), name = programName(w[k].text), args = w.slice(k + 1);
    const flagsOnly = args.every((x) => x.redir || x.text === "-" || /^-(?!c$|[a-z]*c$)/i.test(x.text) || (POWERSHELLS.has(name) && /^-(c|com\w*)$/i.test(x.text)));
    const stdinShell = SHELLS.has(name) ? flagsOnly && !args.some((x) => /^-[a-z]*c[a-z]*$/i.test(x.text))
      : POWERSHELLS.has(name) ? flagsOnly || args.some((x) => x.text === "-")
      : name === "cmd" ? !args.some((x) => /^\/[ck]$/i.test(x.text)) : false;
    if (!stdinShell) continue;
    const dialect = !SHELLS.has(name);
    for (const b of bodies) nested.push({ text: b, ps: dialect });
    for (const v of out) if (v !== w) nested.push({ text: v.slice(v[0].quoted ? 0 : 1).map((x) => x.text).join(" "), ps: dialect });
    for (const x of args) if (x.redir) nested.push({ text: x.text, ps: dialect });
  }
  ctx.chars += nested.reduce((sum, n) => sum + n.text.length, 0);
  if (ctx.chars > MAX_CHARS) throw new TooComplex("too much nested script text");
  // Each script is read once, so repeats (every suffix of `ssh a b c`) cost nothing deeper down.
  const fresh = nested.filter((n) => n.text.trim() && !ctx.seen.has(`${n.ps}:${n.text}`));
  for (const n of fresh) ctx.seen.add(`${n.ps}:${n.text}`);
  if (fresh.length && depth >= MAX_DEPTH) throw new TooComplex("scripts nested too deeply");
  for (const n of fresh) out.push(...readShell(n.text, depth + 1, n.ps, ctx));
  return out;
}

// Reads a command line as POSIX shell and, when `ps` is set, also as PowerShell, so a check sees
// every way the line could run. `failed` is set when a reading failed (an unclosed quote, say);
// callers then also check the raw text, so they fail closed. `complex` is set when the line is past
// the reader's limits; callers refuse it outright.
export function shellCommands(command, { ps = false } = {}) {
  const cmds = [];
  let failed = false, complex = false;
  for (const dialect of ps ? [false, true] : [false]) {
    try { cmds.push(...readShell(String(command), 0, dialect, { seen: new Set(), reads: 0, chars: 0 })); } catch (e) { failed = true; if (e instanceof TooComplex) complex = true; }
  }
  return { cmds, failed, complex };
}

// A command guard matches where a command, or a path to the program it runs, starts: at its first
// word, at an unquoted later word (`sudo npm run deploy`, `bash scripts/release.sh`), or after a `/`
// in one (`./scripts/release.sh`). A match that starts inside a quoted argument (a commit message,
// a grep pattern) is data, not a command. PowerShell is matched without regard to case, as it runs
// commands. A line the reader cannot parse is also matched as plain text.
export function guardMatches(pattern, command, { ps = false } = {}) {
  const { cmds, failed, complex } = shellCommands(command, { ps });
  if (complex || (failed && commandMatches(pattern, command))) return true;
  const re = pattern.match(/^\/(.+)\/([a-z]*)$/);
  for (const w of cmds) {
    if (["echo", "printf", "write-output", "write-host"].includes(programName(w[0].text))) continue;
    const sticky = re && new RegExp(re[1], re[2].replace(/[gy]/g, "") + (w.ps && !re[2].includes("i") ? "iy" : "y"));
    const lit = pattern.replace(/\s+/g, " ").trim();
    const norm = (t) => (w.ps ? t.toLowerCase() : t);
    const text = w.map((x) => x.text.replace(/\\/g, w.ps ? "/" : "\\")).join(" ");
    let at = 0;
    for (const [k, x] of w.entries()) {
      if (!x.redir && (k === 0 || (!x.quoted && !/\s/.test(x.text)))) {
        for (let j = 0; j < x.text.length; j++) {
          if (j > 0 && !"/\\".includes(x.text[j - 1])) continue;
          const rest = text.slice(at + j);
          if (sticky ? (sticky.lastIndex = 0, sticky.test(rest)) : norm(rest).startsWith(norm(lit))) return true;
        }
      }
      at += x.text.length + 1;
    }
  }
  return false;
}

// ---------- tool calls ----------
// Payloads differ slightly between agents; read the fields every current agent provides.

// Copilot CLI: bash or powershell, create and edit ({ path }); its PascalCase hooks report these as
// Bash, Read and Edit, and an apply_patch edit as Edit with the bare patch text as tool_input.
// VS Code: run_in_terminal ({ command }),
// create_file, replace_string_in_file, insert_edit_into_file, edit_notebook_file ({ filePath }),
// multi_replace_string_in_file ({ replacements: [{ filePath }] }). Factory Droid: Execute, Create, Edit.
const SHELL_TOOLS = new Set(["bash", "powershell", "shell", "run_shell_command", "exec_command", "local_shell", "terminal", "execute", "run_in_terminal"]);
const EDIT_TOOLS = new Set([
  "edit", "write", "create", "multiedit", "notebookedit", "write_file", "edit_file", "create_file",
  "str_replace_based_edit_tool", "replace_string_in_file", "multi_replace_string_in_file", "insert_edit_into_file", "edit_notebook_file",
  "replace", "delete", "delete_file",
]);
// Any other tool is read by its input: a tool whose name (its last part, for MCP tools named
// server__tool) says it only reads is let through; for the rest, values under these keys are read
// as shell lines or as code, and every value is checked as a path against the rails.
const READ_ONLY_TOOL = /^(read|get|list|search|grep|glob|find|view|ls|stat|fetch|query|describe|show|lookup|inspect|web)/;
const ACTING_WORD = /write|creat|updat|set|put|post|delet|remov|move|renam|edit|exec|run|apply|patch|save|insert|append|replac|upload|kill|push|commit|mkdir|copy|install/;
const COMMAND_KEY = /^(command|cmd|commandline|command_line|args|argv)$/i;
const CODE_KEY = /^(code|script|source|program)$/i;
const MAX_INPUT_DEPTH = 32;

// An argv array quoted back into one line, so `["bash", "-lc", "x y"]` keeps its script whole.
const quoteArgv = (c) => c.map((a) => String(a)).map((a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : `'${a.replace(/'/g, "'\\''")}'`)).join(" ");

// Every string in a tool's input with the key it sits under; a list of strings under a command
// key is one argv. Past MAX_INPUT_DEPTH the rest is kept as one JSON string, so nothing is dropped.
function inputStrings(v, key = "", depth = 0, out = []) {
  if (depth > MAX_INPUT_DEPTH) out.push({ key, text: JSON.stringify(v) ?? "" });
  else if (typeof v === "string") out.push({ key, text: v });
  else if (Array.isArray(v)) {
    if (COMMAND_KEY.test(key) && v.length && v.every((x) => typeof x === "string")) out.push({ key, text: quoteArgv(v) });
    else for (const x of v) inputStrings(x, key, depth + 1, out);
  } else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) inputStrings(x, k, depth + 1, out);
  return out;
}

function toolInput(input) {
  const ti = input.tool_input ?? input.toolInput ?? input.toolArgs ?? input.input ?? {};
  if (typeof ti !== "string") return ti || {};
  try { return JSON.parse(ti) || {}; } catch { return { input: ti }; }
}

const patchPaths = (ti) => {
  const text = Object.values(ti).filter((v) => typeof v === "string").join("\n");
  return [...text.matchAll(/^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+)$/gm)].map((m) => m[1].trim());
};

// Windsurf Cascade sends { agent_action_name, tool_info } and Antigravity { workspacePaths, toolCall }
// instead of the shared fields.
export function normalizePayload(input) {
  if (Array.isArray(input.workspacePaths)) {
    const out = { ...input, cwd: input.cwd || input.workspacePaths[0] };
    const { name, args = {} } = input.toolCall || {};
    if (name === "run_command") Object.assign(out, { tool_name: "Bash", tool_input: { command: args.CommandLine } });
    else if (/^(write_to_file|replace_file_content|multi_replace_file_content)$/.test(name || "")) Object.assign(out, { tool_name: "Write", tool_input: { file_path: args.TargetFile } });
    else if (name) Object.assign(out, { tool_name: name, tool_input: args });
    return out;
  }
  const ti = input.tool_info;
  if (!input.agent_action_name || !ti) return input;
  const out = { ...input, cwd: input.cwd || ti.cwd, hook_event_name: input.agent_action_name };
  if (input.agent_action_name === "pre_run_command") Object.assign(out, { tool_name: "Bash", tool_input: { command: ti.command_line } });
  if (input.agent_action_name === "pre_write_code") Object.assign(out, { tool_name: "Write", tool_input: { file_path: ti.file_path } });
  if (input.agent_action_name === "pre_user_prompt") out.prompt = ti.user_prompt;
  return out;
}

const PS_LIKE = /(^|[\s;|&({])(remove|set|add|clear|out|new|move|copy|rename|get|invoke|start|write|select|test|resolve|foreach|where|import|export|convertto|convertfrom)-[a-z]+|\.flow\\|\\\.flow|`/i;

// What an edit takes out and puts in, for the hook settings check: old/new strings, a whole new
// file, or the - and + lines of a patch.
function editChange(ti) {
  const edits = [ti, ...(Array.isArray(ti.edits) ? ti.edits : []), ...(Array.isArray(ti.replacements) ? ti.replacements : [])].filter((e) => e && typeof e === "object");
  const pick = (e, keys) => keys.map((k) => e[k]).filter((v) => typeof v === "string");
  const patch = Object.values(ti).filter((v) => typeof v === "string" && v.includes("*** ")).join("\n");
  const removed = [...edits.flatMap((e) => pick(e, ["old_string", "oldString", "old_str"])), ...patch.split("\n").filter((l) => l.startsWith("-"))].join("\n");
  const added = [...edits.flatMap((e) => pick(e, ["new_string", "newString", "new_str", "code"])), ...patch.split("\n").filter((l) => l.startsWith("+"))].join("\n");
  const whole = pick(ti, ["content", "file_text", "CodeContent", "contents"])[0];
  return { removed, added, whole };
}

// Also read a line as PowerShell where it may run as such: a PowerShell tool, a non-Bash shell
// tool on Windows, or a line that looks like PowerShell.
const shellLine = (name, command) => ({ command, ps: /^(powershell|pwsh)$/.test(name) || (process.platform === "win32" && name !== "bash") || PS_LIKE.test(command) });

// What a tool call does, as the hooks check it:
//   { kind: "shell", lines: [{ command, ps }] }
//   { kind: "edit", paths, change }       paths empty when the edit names no file the hook can find
//   { kind: "other", readOnly, lines, code, values }   any other tool, read by its input
export function toolAction(input) {
  const name = String(input.tool_name || input.toolName || "").toLowerCase();
  const ti = toolInput(input);
  if (SHELL_TOOLS.has(name) || (!name && (ti.command || input.command))) {
    const c = ti.command ?? ti.cmd ?? ti.CommandLine ?? ti.command_line ?? input.command ?? "";
    let command = Array.isArray(c) ? quoteArgv(c) : String(c);
    // A shell call whose command sits under a field the hook does not know: read every value.
    if (!command.trim()) command = inputStrings(ti).map((x) => x.text).join("\n");
    return { kind: "shell", lines: [shellLine(name, command)] };
  }
  if (name === "apply_patch" || name === "applypatch") return { kind: "edit", paths: patchPaths(ti), change: editChange(ti) };
  if (EDIT_TOOLS.has(name)) {
    const one = (e) => e?.file_path || e?.filePath || e?.path || e?.notebook_path || e?.target_file || e?.absolute_path;
    const paths = [one(ti), ...patchPaths(ti)];
    for (const list of [ti.replacements, ti.edits]) if (Array.isArray(list)) paths.push(...list.map(one));
    return { kind: "edit", paths: paths.filter(Boolean).map(String), change: editChange(ti) };
  }
  const values = inputStrings(ti);
  return {
    kind: "other",
    name,
    readOnly: ((t) => READ_ONLY_TOOL.test(t) && !ACTING_WORD.test(t))(name.split(/__|[.:/]/).pop()),
    lines: values.filter((x) => COMMAND_KEY.test(x.key)).map((x) => shellLine(name, x.text)),
    code: values.filter((x) => CODE_KEY.test(x.key)).map((x) => x.text),
    // Every value is checked as a path; prose resolves to no real path, so it does no harm.
    values: values.map((x) => x.text).filter((t) => t && t.length < 4096).map((t) => t.replace(/^file:\/\//i, "")),
  };
}

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
const isStateWord = (t, ps) => STATE_PATH.test(norm(t)) || norm(t).split(/[/=:,]/).some((seg) => globHitsState(seg, ps));
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

function commandViolation(w) {
  const { name, args } = head(w);
  const flowAt = w.findIndex((x) => programName(x.text) === "flow.mjs");
  if (flowAt >= 0 && w.slice(flowAt + 1).some((x) => HUMAN_ONLY.has(x.text.toLowerCase()))) return "human";
  // Code that loads flow.mjs itself could call approve() or answer a gate.
  if (INTERPRETERS.test(name) && args.some((x) => /flow\.mjs/i.test(x.text) && programName(x.text) !== "flow.mjs")) return "human";
  if (name === "git" && subcommand(args) === "clean" && args.some((x) => /^-[a-z]*[xX]/.test(x.text)) && !args.some((x) => /^(-[a-z]*n|--dry-run)$/.test(x.text))) return "clean";
  if (w.some((x) => x.redir && isStateWord(x.text, w.ps))) return "state";
  // Interpreter code can open any path, so any mention of .flow in its arguments counts.
  if (INTERPRETERS.test(name)) return args.some((x) => mentionsState(x.text)) ? "state" : null;
  if (name === "cp" || /^(copy-item|cpi|copy)$/.test(name)) {
    // Copying out of .flow/ only reads it; the destination must not be in it.
    const dest = name === "cp"
      ? (args.some((x) => /^(-t|--target-directory)/.test(x.text)) ? null : args.filter((x) => !/^-/.test(x.text)).pop())
      : args[args.findIndex((x) => /^-d(e(s(t(i(n(a(t(i(o(n)?)?)?)?)?)?)?)?)?)?$/i.test(x.text)) + 1];
    if (!dest || isStateWord(dest.text, w.ps)) return args.some((x) => isStateWord(x.text, w.ps)) ? "state" : null;
    return args.some((x) => x !== dest && mentionsState(x.text) && STATE_PATH.test(norm(x.text)) && !purePath(x.text.replace(/^-(path|literalpath|lp):/i, ""))) ? "state" : null;
  }
  const reader = READERS.has(name) ? READERS.get(name) : name === "git" && GIT_READS.has(subcommand(args)) ? /^--output/ : undefined;
  if (reader === undefined) {
    const deletes = w.ps && /^(remove-item|rm|ri|del|erase|rd|rmdir|clear-content|clc|move-item|mi|mv|move|rename-item|rni|ren)$/.test(name);
    return args.some((x) => isStateWord(x.text, w.ps && deletes)) ? "state" : null;
  }
  if (!args.some((x) => mentionsState(x.text))) return null;
  if (reader && args.some((x) => reader.test(x.text))) return "state";
  for (const [j, x] of args.entries()) {
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
const HOOK_CONFIGS = [".claude/settings.json", ".claude/settings.local.json", ".codex/hooks.json", ".codex/config.toml", ".cursor/hooks.json",
  ".agents/hooks.json", ".qwen/settings.json", ".factory/hooks.json", ".factory/settings.json", ".devin/hooks.json", ".windsurf/hooks.json"];
export function railsPaths(root, skillDir) {
  const configs = [...HOOK_CONFIGS, `.github/hooks/${path.basename(skillDir)}.json`].map((f) => path.join(root, f));
  configs.push(path.join(os.homedir(), ".claude", "settings.json"), path.join(os.homedir(), ".codex", "config.toml"));
  return { skill: skillDir, configs, state: path.join(root, ".flow") };
}
// Paths compared as the most permissive file system would: any case, either slash.
export const samePath = (a, b) => norm(a) === norm(b);
export const inside = (p, dir) => samePath(p, dir) || norm(p).startsWith(norm(dir).replace(/\/$/, "") + "/");
// Hook settings may change except where an edit drops a flow.mjs hook or turns hooks off.
const DISABLES_HOOKS = /disableAllHooks|codex_hooks\s*=\s*false/i;
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
  if (name === "git" && GIT_READS.has(subcommand(args))) return null;
  if (INTERPRETERS.test(name)) {
    // Interpreter code (not the script it runs) that names the rails could rewrite them.
    const rel = norm(path.relative(ctx.root, rp.skill));
    return args.some((x) => /\s|[(;]/.test(x.text) && (norm(x.text).includes(rel) || HOOK_CONFIGS.some((f) => norm(x.text).includes(f)) || DISABLES_HOOKS.test(x.text))) ? "rails" : null;
  }
  for (const x of [...args, ...w.slice(0, k)]) {
    if (programName(x.text) === "flow.mjs" || /\s/.test(x.text) || (!x.redir && /^-/.test(x.text) && !/^-[a-z]+:/i.test(x.text))) continue;
    const p = resolve(x.text);
    if (inside(p, rp.skill) || rp.configs.some((q) => samePath(q, p))) return "rails";
  }
  return null;
}

// Commands that change whatever is piped into them (`find .flow | xargs rm`, `gci .flow | Remove-Item`).
const PIPE_WRITERS = /^(xargs|parallel|remove-item|ri|rm|del|erase|rd|rmdir|move-item|mi|mv|move|rename-item|rni|set-content|sc|add-content|ac|clear-content|clc|out-file|copy-item|cpi|tee-object|tee|new-item|ni)$/;

// What a shell line would do that the agent may not: "human" (a human-only command), "rails",
// "clean" (git clean -x), "state" (change .flow/), "complex" (past what the reader follows), or
// null. ctx = { root, cwd, skillDir } adds the rails check; without it only the state is checked.
export function shellViolation(command, ps, ctx) {
  const { cmds, failed, complex } = shellCommands(command, { ps });
  if (complex) return "complex";
  const found = new Set(cmds.flatMap((w) => [commandViolation(w), ctx && railsViolation(w, ctx)]).filter(Boolean));
  const pipeWriter = (w) => {
    const { k, name } = head(w);
    if (!PIPE_WRITERS.test(name)) return false;
    if (!/^(xargs|parallel)$/.test(name)) return true;
    // xargs runs a program on what it reads: only readers (and echo) leave .flow/ alone.
    let j = k + 1;
    while (j < w.length && /^-/.test(w[j].text)) j += /^-[IndPLsEa]$/.test(w[j].text) ? 2 : 1;
    const prog = j < w.length ? programName(w[j].text) : "echo";
    return !pureReader(prog) && !["echo", "printf"].includes(prog);
  };
  const statePiped = cmds.some((w) => w.piped && pipeWriter(w)) && cmds.some((w) => w.some((x) => isStateWord(x.text, w.ps)));
  if (statePiped) found.add("state");
  if (failed) {
    // Unreadable as shell: fall back to the raw text, conservatively.
    if (/flow\.mjs["']?\s+(.*\s)?(approve|reject|suspend|unsuspend|hook|mcp)\b/i.test(command)) found.add("human");
    if (/(^|[\s'"=:(/\\,])\.flow([\\/\s'")]|$)/i.test(command)) found.add("state");
  }
  if (failed && ctx && (/disableAllHooks/i.test(command) || norm(command).includes(norm(path.relative(ctx.root, ctx.skillDir))))) found.add("rails");
  return ["human", "rails", "clean", "state"].find((v) => found.has(v)) || null;
}

// A line made only of reading commands (and flow.mjs agent commands), for when guards are unbound.
export function readOnly(command, ps) {
  const { cmds, failed } = shellCommands(command, { ps });
  if (failed) return false;
  return cmds.every((w) => {
    const { name, args } = head(w);
    if (w.some((x) => x.redir)) return false;
    if (name === "node" && args[0] && programName(args[0].text) === "flow.mjs") return true;
    if (name === "git") return GIT_READS.has(subcommand(args)) && !["add", "commit"].includes(subcommand(args));
    if (["echo", "printf", "pwd", "true"].includes(name)) return true;
    const flags = READERS.get(name);
    return READERS.has(name) && !(flags && args.some((x) => flags.test(x.text)));
  });
}

// Whether an edit of a hook settings file removes a flow.mjs hook or turns hooks off.
export function dropsHooks(abs, act) {
  const { removed, added, whole } = act.change;
  if (DISABLES_HOOKS.test(added) || DISABLES_HOOKS.test(whole ?? "")) return true;
  if (/flow\.mjs/.test(removed)) return true;
  if (whole === undefined) return false;
  let before = "";
  try { before = fs.readFileSync(abs, "utf8"); } catch { return false; }
  return [...before.matchAll(/[^"'\n]*flow\.mjs[^"'\n]*/g)].some((m) => !whole.includes(m[0]));
}
