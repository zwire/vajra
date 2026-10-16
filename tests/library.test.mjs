// Checks that the shipped content (examples, blueprints, eval cases, docs) agrees with the validator.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSkill, validatePlaybook, toMermaid, parseFrontmatter, ENUMS, PROFILE_AXES, SKILL_FIELDS, VERSION } from "../skills/vajra/scripts/validate.mjs";
import { loadCase, check } from "../evals/eval.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const skill = path.join(root, "skills", "vajra");
const read = (...p) => fs.readFileSync(path.join(...p), "utf8");
const examples = fs.readdirSync(path.join(root, "examples")).filter((d) => fs.statSync(path.join(root, "examples", d)).isDirectory());
const blueprintDir = path.join(skill, "references", "blueprints");
const blueprints = fs.readdirSync(blueprintDir).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.replace(/\.md$/, ""));

// ---------- examples ----------

for (const ex of examples) {
  const dir = path.join(root, "examples", ex);
  test(`example ${ex} is valid with no warnings, and its project binds every name`, () => {
    const r = validateSkill(dir, { project: path.join(root, "examples", `${ex}.project.md`) });
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.warnings, []);
    assert.ok(Object.keys(r.bindings).length > 0, "the example names its repository values through bindings");
  });
  test(`example ${ex} carries the current runtime`, () => {
    for (const f of ["flow.mjs", "validate.mjs"]) {
      assert.equal(read(dir, "scripts", f), read(skill, "scripts", f), `run: npm run examples (${f} differs)`);
    }
  });
  test(`example ${ex} graph.md is up to date`, () => {
    const graph = read(dir, "graph.md");
    assert.ok(graph.includes(toMermaid(validateSkill(dir))), `run: node skills/vajra/scripts/validate.mjs examples/${ex} --write-graph`);
  });
}

// ---------- blueprints ----------

test("every blueprint is a valid playbook", () => {
  for (const id of blueprints) {
    const r = validatePlaybook(read(blueprintDir, `${id}.md`), id, `blueprints/${id}.md`);
    assert.deepEqual(r.errors, [], id);
    assert.deepEqual(r.warnings, [], id);
  }
});

test("the blueprint library forms a valid graph", () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lg-bp-")), "blueprints");
  fs.mkdirSync(path.join(dir, "playbooks"), { recursive: true });
  for (const id of blueprints) fs.copyFileSync(path.join(blueprintDir, `${id}.md`), path.join(dir, "playbooks", `${id}.md`));
  fs.writeFileSync(path.join(dir, "SKILL.md"), `---\nname: blueprints\ndescription: all blueprints\n---\n\n${blueprints.map((id) => `[${id}](playbooks/${id}.md)`).join("\n")}\n`);
  assert.deepEqual(validateSkill(dir).errors, []);
});

test("the blueprint index lists every blueprint file", () => {
  const index = read(blueprintDir, "README.md");
  const linked = new Set([...index.matchAll(/\]\(([a-z0-9-]+)\.md\)/g)].map((m) => m[1]));
  assert.deepEqual([...linked].sort(), [...blueprints].sort());
});

// ---------- evals ----------

for (const f of fs.readdirSync(path.join(root, "evals", "cases")).filter((f) => f.endsWith(".json"))) {
  const c = loadCase(path.join(root, "evals", "cases", f));
  test(`eval case ${f} passes on its reference example`, { skip: c.reference ? false : "no reference (live-only case)" }, () => {
    const res = check(c, path.join(root, c.reference));
    assert.ok(res.pass, res.results.filter((x) => !x.pass).map((x) => `${x.name}: ${x.detail}`).join("; "));
  });
}

// ---------- docs agree with the validator ----------

test("graph-model.md documents the same enums as the validator", () => {
  const doc = read(skill, "references", "graph-model.md");
  for (const [key, values] of Object.entries(ENUMS)) {
    const m = doc.match(new RegExp(`^${key}:\\s+\\S+\\s+#\\s*(.+)$`, "m"));
    assert.ok(m, `no commented "${key}:" line in graph-model.md`);
    const documented = m[1].replace(/\(.*\)/, "").split("|").map((s) => s.trim()).filter(Boolean);
    assert.deepEqual(documented, values, key);
  }
});

test("style-profile.md documents the same axes and values as the validator", () => {
  const doc = read(skill, "references", "style-profile.md");
  for (const [axis, values] of Object.entries(PROFILE_AXES)) {
    const row = doc.match(new RegExp("^\\| `" + axis + "` \\| (.+?) \\|", "m"));
    assert.ok(row, `axis ${axis} missing from style-profile.md`);
    if (!values) continue;
    const documented = [...row[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    assert.deepEqual(documented, values, axis);
  }
});

test("the profile template lists every axis in its frontmatter", () => {
  const tpl = read(skill, "templates", "profile.md");
  for (const axis of [...Object.keys(PROFILE_AXES), "schema", "generator"]) assert.match(tpl, new RegExp(`^${axis}: `, "m"), axis);
});

test("validator VERSION matches package.json", () => {
  assert.equal(VERSION, JSON.parse(read(root, "package.json")).version);
});

// ---------- the skill is self-contained and portable ----------

test("vajra's own SKILL.md follows the Agent Skills specification", () => {
  const { data, problems } = parseFrontmatter(read(skill, "SKILL.md"));
  assert.deepEqual(problems, []);
  for (const k of Object.keys(data)) assert.ok(SKILL_FIELDS.includes(k), `non-standard field ${k}`);
  assert.equal(data.name, "vajra");
  assert.equal(data.metadata.version, VERSION);
});

test("every link inside the skill resolves to a file inside the skill", () => {
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (f.endsWith(".md")) files.push(f); } };
  walk(skill);
  const bad = [];
  for (const f of files) {
    if (f.includes(`${path.sep}templates${path.sep}`)) continue; // templates link inside the generated skill
    const text = fs.readFileSync(f, "utf8").replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split("#")[0];
      if (!target) continue;
      const resolved = path.resolve(path.dirname(f), target);
      if (/^[a-z]+:/i.test(target) || !resolved.startsWith(skill) || !fs.existsSync(resolved)) bad.push(`${path.relative(skill, f)} -> ${m[1]}`);
    }
  }
  assert.deepEqual(bad, []);
});
