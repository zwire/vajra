#!/usr/bin/env node
// Answer surface for vajra's consult session: one question round, rendered for whichever channel
// the agent has. The round is a small JSON spec the agent writes; the answers come back as JSON.
//
// Usage:
//   node interview.mjs text  <round.json|->                     print the round as compact chat text
//   node interview.mjs html  <round.json|-> [--out <file>]      write a one-file form; answers are copied back
//   node interview.mjs serve <round.json|-> [--port <n>] [--timeout <s>] [--open]
//                                                               serve the form on 127.0.0.1, print its URL,
//                                                               wait for submit, print the answers JSON, exit
//   node interview.mjs check <round.json|->                     validate the spec only
//
// Spec:
//   { "title": "...", "intro": "...",
//     "questions": [
//       { "id": "failure_cost", "prompt": "What does a mistake in production cost?",
//         "why": "decides gate strictness", "kind": "single",           // single | multi | text
//         "options": [ { "id": "a", "label": "Nothing, it's a prototype", "value": "throwaway" }, ... ],
//         "recommended": "c", "reason": "the repository bills customers",  // option id(s), or default text
//         "evidence": "src/billing/ exists" } ] }
//
// Answers: { "<id>": "<value>" | ["<value>", ...] | "<text>", "<id>.note": "<free text>" }.
// Every field starts at its recommendation, so submitting untouched accepts them all.
// Exit codes: 0 ok, 1 invalid spec, 2 usage, 4 serve timed out. No dependencies: Node 18+ only.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const KINDS = ["single", "multi", "text"];
const ID_RE = /^[A-Za-z0-9_.-]+$/;

export function checkSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object" || !Array.isArray(spec.questions) || !spec.questions.length) return ["spec needs a non-empty questions array"];
  const seen = new Set();
  spec.questions.forEach((q, i) => {
    const at = `questions[${i}]`;
    if (!q || typeof q !== "object") return errors.push(`${at} is not an object`);
    if (!ID_RE.test(q.id || "")) errors.push(`${at}.id must match ${ID_RE}`);
    else if (seen.has(q.id)) errors.push(`${at}.id "${q.id}" is repeated`);
    seen.add(q.id);
    if (!q.prompt) errors.push(`${at}.prompt is missing`);
    const kind = q.kind || "single";
    if (!KINDS.includes(kind)) errors.push(`${at}.kind must be one of ${KINDS.join(", ")}`);
    if (kind === "text") return;
    if (!Array.isArray(q.options) || q.options.length < 2) return errors.push(`${at} needs at least two options`);
    const ids = q.options.map((o) => o && o.id);
    if (ids.some((x) => !ID_RE.test(x || "")) || new Set(ids).size !== ids.length) errors.push(`${at}.options need unique ids`);
    if (q.options.some((o) => !o.label)) errors.push(`${at}.options need labels`);
    const rec = [].concat(q.recommended ?? []);
    if (!rec.length) errors.push(`${at}.recommended is missing: every question carries a recommendation`);
    if (kind === "single" && rec.length > 1) errors.push(`${at}.recommended must be one option id`);
    for (const r of rec) if (!ids.includes(r)) errors.push(`${at}.recommended "${r}" is not an option id`);
  });
  return errors;
}

const valueOf = (o) => (o.value === undefined ? o.id : o.value);

// The answers an untouched form submits: every recommendation.
export function defaults(spec) {
  const out = {};
  for (const q of spec.questions) {
    const kind = q.kind || "single";
    if (kind === "text") out[q.id] = q.recommended ?? "";
    else {
      const rec = [].concat(q.recommended);
      const picked = q.options.filter((o) => rec.includes(o.id)).map(valueOf);
      out[q.id] = kind === "multi" ? picked : picked[0];
    }
  }
  return out;
}

export function renderText(spec) {
  const lines = [];
  if (spec.title) lines.push(spec.title, "");
  if (spec.intro) lines.push(spec.intro, "");
  spec.questions.forEach((q, i) => {
    const kind = q.kind || "single";
    lines.push(`${i + 1}. ${q.prompt}${q.why ? `  (${q.why})` : ""}${kind === "multi" ? "  [pick any]" : ""}`);
    if (kind === "text") {
      lines.push(`   Draft: ${q.recommended || "(none)"}${q.reason ? `  ← ${q.reason}` : ""}`);
    } else {
      const rec = [].concat(q.recommended);
      for (const o of q.options) {
        const mark = rec.includes(o.id) ? `  ← recommended${q.reason ? `: ${q.reason}` : ""}` : "";
        lines.push(`   ${o.id}) ${o.label}${mark}`);
      }
    }
    if (q.evidence) lines.push(`   Evidence: ${q.evidence}`);
  });
  const first = spec.questions.find((q) => (q.kind || "single") !== "text");
  const example = first ? `${spec.questions.indexOf(first) + 1}${first.options.at(-1).id}` : "1: <your text>";
  lines.push("", `Reply "ok" to take every recommendation, or only what differs (for example "${example}").`);
  return lines.join("\n");
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function renderHtml(spec, { submitUrl = "" } = {}) {
  const body = spec.questions.map((q, i) => {
    const kind = q.kind || "single";
    const head = `<legend><span class="n">${i + 1}</span>${esc(q.prompt)}</legend>${q.why ? `<p class="why">${esc(q.why)}</p>` : ""}`;
    const foot = `${q.reason ? `<p class="rec">Recommended: ${esc(q.reason)}</p>` : ""}${q.evidence ? `<p class="ev">Evidence: ${esc(q.evidence)}</p>` : ""}`;
    if (kind === "text") {
      return `<fieldset data-id="${esc(q.id)}" data-kind="text">${head}<textarea name="${esc(q.id)}" rows="3">${esc(q.recommended)}</textarea>${foot}</fieldset>`;
    }
    const rec = [].concat(q.recommended);
    const type = kind === "multi" ? "checkbox" : "radio";
    const opts = q.options.map((o) => `<label class="opt${rec.includes(o.id) ? " is-rec" : ""}"><input type="${type}" name="${esc(q.id)}" value="${esc(JSON.stringify(valueOf(o)))}"${rec.includes(o.id) ? " checked" : ""}><span>${esc(o.label)}</span>${rec.includes(o.id) ? '<em>recommended</em>' : ""}</label>`).join("");
    return `<fieldset data-id="${esc(q.id)}" data-kind="${kind}">${head}<div class="opts">${opts}</div>${foot}<input class="note" name="${esc(q.id)}.note" placeholder="Something else, or a note (optional)"></fieldset>`;
  }).join("\n");
  const title = esc(spec.title || "Questions");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
:root{--bg:#fafaf9;--fg:#1c1917;--mute:#78716c;--line:#e7e5e4;--card:#fff;--acc:#b45309;--accbg:#fef3c7}
@media (prefers-color-scheme:dark){:root{--bg:#1c1917;--fg:#f5f5f4;--mute:#a8a29e;--line:#44403c;--card:#292524;--acc:#fbbf24;--accbg:#422006}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:720px;margin:0 auto;padding:24px 16px 120px}h1{font-size:20px;margin:0 0 4px}.intro{color:var(--mute);margin:0 0 20px}
fieldset{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:14px 16px;margin:0 0 14px}
legend{font-weight:600;padding:0 4px;display:flex;gap:8px;align-items:baseline}.n{color:var(--mute);font-variant-numeric:tabular-nums}
.why,.rec,.ev{margin:4px 0;color:var(--mute);font-size:13px}.opts{display:grid;gap:6px;margin:8px 0}
.opt{display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:8px;cursor:pointer}
.opt:has(input:checked){border-color:var(--acc);background:var(--accbg)}.opt em{margin-left:auto;font-size:12px;color:var(--acc);font-style:normal}
textarea,.note{width:100%;font:inherit;color:inherit;background:transparent;border:1px solid var(--line);border-radius:8px;padding:8px}
.note{margin-top:4px;font-size:13px}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:12px 16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
button{font:inherit;padding:8px 16px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
button.primary{background:var(--acc);border-color:var(--acc);color:var(--bg);font-weight:600}#msg{width:100%;text-align:center;color:var(--mute);font-size:13px;margin:0}
pre{white-space:pre-wrap;word-break:break-all;font-size:12px;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px}
</style></head><body><main>
<h1>${title}</h1>${spec.intro ? `<p class="intro">${esc(spec.intro)}</p>` : ""}
<p class="intro">Everything starts at the recommendation. Change only what is wrong, then ${submitUrl ? "send" : "copy and paste the answers back"}.</p>
<form id="f">${body}</form><pre id="out" hidden></pre></main>
<div class="bar">${submitUrl ? '<button class="primary" id="send" type="button">Send answers</button>' : ""}<button${submitUrl ? "" : ' class="primary"'} id="copy" type="button">Copy answers</button><p id="msg"></p></div>
<script>
const f=document.getElementById("f"),msg=document.getElementById("msg"),out=document.getElementById("out");
function collect(){const a={};for(const fs of f.querySelectorAll("fieldset")){const id=fs.dataset.id,k=fs.dataset.kind;
if(k==="text")a[id]=fs.querySelector("textarea").value.trim();
else{const v=[...fs.querySelectorAll("input:checked")].map(i=>JSON.parse(i.value));a[id]=k==="multi"?v:(v[0]??null);
const n=fs.querySelector(".note").value.trim();if(n)a[id+".note"]=n;}}return a;}
document.getElementById("copy").onclick=async()=>{const t=JSON.stringify(collect());out.textContent=t;out.hidden=false;
try{await navigator.clipboard.writeText(t);msg.textContent="Copied. Paste it back to the agent.";}catch{msg.textContent="Copy the text above and paste it back to the agent.";}};
${submitUrl ? `document.getElementById("send").onclick=async()=>{try{const r=await fetch(${JSON.stringify(submitUrl)},{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(collect())});
if(!r.ok)throw new Error(r.status);msg.textContent="Sent. You can close this tab.";document.querySelectorAll("button").forEach(b=>b.disabled=true);}
catch(e){msg.textContent="Could not send ("+e.message+"). Use Copy answers instead.";}};` : ""}
</script></body></html>
`;
}

function readSpec(file) {
  const raw = file === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

function openBrowser(url) {
  const [cmd, args] = process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  try { spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref(); } catch {}
}

export function serve(spec, { port = 0, timeout = 900, open = false, log = (s) => process.stderr.write(s + "\n") } = {}) {
  const token = crypto.randomBytes(12).toString("hex");
  const page = renderHtml(spec, { submitUrl: `/${token}/answers` });
  return new Promise((resolve, reject) => {
    let timer;
    const server = http.createServer((req, res) => {
      if (req.method === "GET" && req.url === `/${token}`) {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        return res.end(page);
      }
      if (req.method === "POST" && req.url === `/${token}/answers`) {
        let data = "";
        req.on("data", (c) => { data += c; if (data.length > 1e6) req.destroy(); });
        req.on("end", () => {
          let answers;
          try { answers = JSON.parse(data); } catch { res.writeHead(400); return res.end("bad json"); }
          res.writeHead(204); res.end();
          clearTimeout(timer);
          server.close();
          resolve(answers);
        });
        return;
      }
      res.writeHead(404); res.end();
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const url = `http://127.0.0.1:${server.address().port}/${token}`;
      log(`Open ${url} to answer. Waiting up to ${timeout}s.`);
      if (open) openBrowser(url);
      timer = setTimeout(() => { server.close(); reject(Object.assign(new Error("timed out waiting for answers"), { code: 4 })); }, timeout * 1000);
    });
  });
}

function flag(args, name) {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
}

export async function main(argv) {
  const args = [...argv];
  const open = args.includes("--open");
  if (open) args.splice(args.indexOf("--open"), 1);
  const outFile = flag(args, "--out");
  const port = Number(flag(args, "--port") ?? 0);
  const timeout = Number(flag(args, "--timeout") ?? 900);
  const [cmd, file] = args;
  if (!["text", "html", "serve", "check"].includes(cmd) || !file) {
    process.stderr.write("usage: interview.mjs <text|html|serve|check> <round.json|-> [--out <file>] [--port <n>] [--timeout <s>] [--open]\n");
    return 2;
  }
  let spec;
  try { spec = readSpec(file); } catch (e) { process.stderr.write(`cannot read spec: ${e.message}\n`); return 1; }
  const errors = checkSpec(spec);
  if (errors.length) { process.stderr.write(errors.map((e) => `ERROR ${e}`).join("\n") + "\n"); return 1; }
  if (cmd === "check") { process.stdout.write("OK\n"); return 0; }
  if (cmd === "text") { process.stdout.write(renderText(spec) + "\n"); return 0; }
  if (cmd === "html") {
    const target = path.resolve(outFile || path.join(fs.mkdtempSync(path.join(os.tmpdir(), "vajra-interview-")), "round.html"));
    fs.writeFileSync(target, renderHtml(spec));
    process.stdout.write(target + "\n");
    if (open) openBrowser(target);
    return 0;
  }
  try {
    const answers = await serve(spec, { port, timeout, open });
    process.stdout.write(JSON.stringify(answers) + "\n");
    return 0;
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return e.code === 4 ? 4 : 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
