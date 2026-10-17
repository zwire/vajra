// Reading the agent's tool calls for the hooks: which tool it is (shell, edit or other) and what it
// would run or change, from the payloads of Claude Code, Codex, GitHub Copilot and VS Code.
// Payloads differ slightly between agents; read the fields every current agent provides.

// Claude Code: Bash; Edit, Write, MultiEdit, NotebookEdit. Codex: shell, local_shell, exec_command;
// apply_patch. Copilot CLI: bash or powershell, create and edit ({ path }); its PascalCase hooks
// report these as Bash, Read and Edit, and an apply_patch edit as Edit with the bare patch text as
// tool_input. VS Code: run_in_terminal ({ command }), create_file, replace_string_in_file,
// insert_edit_into_file, edit_notebook_file ({ filePath }), multi_replace_string_in_file
// ({ replacements: [{ filePath }] }).
const SHELL_TOOLS = new Set(["bash", "powershell", "shell", "local_shell", "exec_command", "run_in_terminal"]);
const EDIT_TOOLS = new Set([
  "edit", "write", "create", "multiedit", "notebookedit",
  "create_file", "replace_string_in_file", "multi_replace_string_in_file", "insert_edit_into_file", "edit_notebook_file",
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

// A line runs in PowerShell from a PowerShell tool and in a POSIX shell from Bash or anywhere but
// Windows; a shell tool other than Bash on Windows may run either, so it is read both ways.
// Only the shell the line runs in is read: reading a Bash line as PowerShell as well found
// deletions in ordinary lines (`rm -rf build/* && echo \`date\``), which was the hooks' worst source
// of false blocks.
const shellLine = (name, command) => ({ command, ps: /^(powershell|pwsh)$/.test(name) ? true : process.platform === "win32" && name !== "bash" ? "both" : false });

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
