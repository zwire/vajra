// The consult answer surfaces: spec checks, text and form rendering, and the local form round trip.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkSpec, defaults, renderText, renderHtml } from "../skills/vajra/scripts/interview.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const script = path.join(root, "skills", "vajra", "scripts", "interview.mjs");
const template = path.join(root, "skills", "vajra", "templates", "interview-round.json");
const spec = JSON.parse(fs.readFileSync(template, "utf8"));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

test("the shipped round template is a valid spec", () => {
  assert.deepEqual(checkSpec(spec), []);
  assert.equal(run("check", template).status, 0);
});

test("a spec without recommendations or with unknown ones is refused", () => {
  const bad = { questions: [
    { id: "a", prompt: "?", options: [{ id: "x", label: "X" }, { id: "y", label: "Y" }] },
    { id: "b", prompt: "?", options: [{ id: "x", label: "X" }, { id: "y", label: "Y" }], recommended: "z" },
    { id: "b", prompt: "?", kind: "text" },
  ] };
  const errors = checkSpec(bad).join("\n");
  assert.match(errors, /questions\[0\]\.recommended is missing/);
  assert.match(errors, /"z" is not an option id/);
  assert.match(errors, /"b" is repeated/);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "vj-int-")), "bad.json");
  fs.writeFileSync(f, JSON.stringify(bad));
  assert.equal(run("text", f).status, 1);
});

test("defaults are the recommendations, by value", () => {
  assert.deepEqual(defaults(spec), {
    failure_cost: "customer",
    facets: ["measured-outcome", "data-mutation"],
    evidence: spec.questions[2].recommended,
  });
});

test("text marks every recommendation and offers a one-word accept", () => {
  const t = renderText(spec);
  assert.match(t, /c\) Customer impact {2}← recommended: you mentioned paying customers/);
  assert.equal((t.match(/← recommended/g) || []).length, 3);
  assert.match(t, /Reply "ok" to take every recommendation/);
});

test("the form pre-selects recommendations and escapes user text", () => {
  const html = renderHtml({ title: "<x>", questions: [{ id: "q", prompt: "<script>alert(1)</script>", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }], recommended: "b" }] });
  assert.ok(!html.includes("<script>alert(1)"));
  assert.match(html, /value="&quot;b&quot;" checked/);
  assert.ok(!html.includes("Send answers"), "a file form only copies");
  assert.ok(renderHtml(spec, { submitUrl: "/t/answers" }).includes("Send answers"));
});

test("html writes a self-contained file to the given path", () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "vj-int-")), "round.html");
  const r = run("html", template, "--out", out);
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), out);
  assert.ok(!/<(script|link)[^>]+(src|href)=/.test(fs.readFileSync(out, "utf8")), "no external resources");
});

test("serve returns the submitted answers and only accepts its own token", async () => {
  const p = spawn(process.execPath, [script, "serve", template, "--timeout", "20"]);
  let stdout = "";
  p.stdout.on("data", (d) => { stdout += d; });
  const url = await new Promise((resolve) => p.stderr.on("data", (d) => { const m = /http:\/\/127\.0\.0\.1:\d+\/\w+/.exec(String(d)); if (m) resolve(m[0]); }));
  const origin = new URL(url).origin;
  assert.equal((await fetch(`${origin}/`)).status, 404);
  assert.equal((await fetch(`${origin}/wrong/answers`, { method: "POST", body: "{}" })).status, 404);
  const page = await fetch(url);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Send answers/);
  const answers = { failure_cost: "regulated", facets: [], evidence: "x", "facets.note": "none" };
  assert.equal((await fetch(`${url}/answers`, { method: "POST", body: JSON.stringify(answers) })).status, 204);
  const code = await new Promise((resolve) => p.on("close", resolve));
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(stdout), answers);
});

test("serve gives up with exit code 4 when nobody answers", () => {
  const r = spawnSync(process.execPath, [script, "serve", template, "--timeout", "1"], { encoding: "utf8" });
  assert.equal(r.status, 4);
});
