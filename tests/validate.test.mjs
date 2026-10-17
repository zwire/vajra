import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSkill, toMermaid, parseFrontmatter, SCHEMA } from "../skills/vajra/scripts/validate.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const validator = path.join(root, "skills", "vajra", "scripts", "validate.mjs");

function playbook({ id, phase = "any", lifecycle = "any", kind = "work", promotes, exits = [["end", "done"]], terminal = false, steps = ["Do the thing."], done = "- x", extra = "" }) {
  const exitYaml = exits.length ? "exits:\n" + exits.map(([to, when, on]) => `  - to: ${to}\n    when: ${when}${on ? `\n    on: ${on}` : ""}`).join("\n") + "\n" : "";
  return `---\nid: ${id}\ntitle: ${id}\nphase: ${phase}\nlifecycle: ${lifecycle}\nkind: ${kind}\n${promotes ? `promotes: ${promotes}\n` : ""}${terminal ? "terminal: true\n" : ""}${extra}${exitYaml}---\n\n## Purpose\n\nx\n\n## Steps\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n## Done when\n\n${done}\n`;
}

const AXES = {
  schema: SCHEMA, generator: "vajra@test", uncertainty: "complex", requirements: "unknown", journey: "[explore]",
  failure_cost: "internal", artifact_lifetime: "disposable", cadence: "continuous", team: "solo", verification: "evidence",
  autonomy: "medium", parallelism: "none", domains: "[demo]", facets: "[shared-contracts]", hardware: "none", invocation: "explicit",
  rails: "standard",
};

function makeSkill(name, { routes, playbooks, description = "Test skill.", profile, skillFm = "" }) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lg-")), name);
  fs.mkdirSync(path.join(dir, "playbooks"), { recursive: true });
  const table = routes.map((id) => `| r | [${id}](playbooks/${id}.md) |`).join("\n");
  fs.writeFileSync(path.join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: ${description}\n${skillFm}---\n\n# ${name}\n\n${table}\n`);
  for (const p of playbooks) fs.writeFileSync(path.join(dir, "playbooks", `${p.id}.md`), typeof p.raw === "string" ? p.raw : playbook(p));
  if (profile) {
    const fm = Object.entries({ ...AXES, ...profile }).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join("\n");
    fs.writeFileSync(path.join(dir, "profile.md"), `---\n${fm}\n---\n\n# Style profile\n\n## Domain model\n\nA demo.\n`);
  }
  return dir;
}

const hasError = (r, re) => r.errors.some((e) => re.test(e));
const hasWarning = (r, re) => r.warnings.some((e) => re.test(e));
const gatedFlow = [
  { id: "spike", lifecycle: "throwaway", exits: [["decide", "answered"]] },
  { id: "decide", kind: "gate", promotes: "throwaway->tracer", exits: [["build", "go"], ["end", "no-go"]] },
  { id: "build", lifecycle: "tracer" },
];

// ---------- graph ----------

test("minimal valid skill passes", () => {
  const dir = makeSkill("ok-flow", { routes: ["a"], playbooks: [{ id: "a" }] });
  assert.deepEqual(validateSkill(dir).errors, []);
});

test("missing exit target is an error", () => {
  const dir = makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a", exits: [["nowhere", "always"]] }] });
  assert.ok(hasError(validateSkill(dir), /exit target "nowhere" does not exist/));
});

test("unreachable playbook is an error", () => {
  const dir = makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a" }, { id: "orphan" }] });
  assert.ok(hasError(validateSkill(dir), /orphan\.md: unreachable/));
});

test("trap cycle is an error", () => {
  const dir = makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a", exits: [["b", "go"]] }, { id: "b", exits: [["a", "back"]] }] });
  assert.ok(hasError(validateSkill(dir), /cannot reach an end/));
});

test("router link to a missing playbook is an error", () => {
  const dir = makeSkill("x-flow", { routes: ["a", "ghost"], playbooks: [{ id: "a" }] });
  assert.ok(hasError(validateSkill(dir), /routes to missing playbook "playbooks\/ghost\.md"/));
});

test("invalid name and missing exits are errors", () => {
  const r = validateSkill(makeSkill("Bad_Name", { routes: ["a"], playbooks: [{ id: "a", exits: [] }] }));
  assert.ok(hasError(r, /must be 1-64 lowercase letters/));
  assert.ok(hasError(r, /needs at least one exit/));
});

test("terminal playbook needs no exits", () => {
  const dir = makeSkill("ok-flow", { routes: ["a"], playbooks: [{ id: "a", exits: [], terminal: true }] });
  assert.deepEqual(validateSkill(dir).errors, []);
});

// ---------- lifecycles and gates ----------

test("direct lifecycle raise without a gate is an error", () => {
  const dir = makeSkill("x-flow", {
    routes: ["spike"],
    playbooks: [{ id: "spike", lifecycle: "throwaway", exits: [["build", "works"]] }, { id: "build", lifecycle: "tracer" }],
  });
  assert.ok(hasError(validateSkill(dir), /raises lifecycle throwaway -> tracer/));
});

test("lifecycle raise through an 'any' detour is an error", () => {
  const dir = makeSkill("x-flow", {
    routes: ["spike"],
    playbooks: [
      { id: "spike", lifecycle: "throwaway", exits: [["helper", "stuck"]] },
      { id: "helper", kind: "service", exits: [["build", "fixed"]] },
      { id: "build", lifecycle: "tracer" },
    ],
  });
  assert.ok(hasError(validateSkill(dir), /spike\.md: path to "build" raises lifecycle/));
});

test("lifecycle raise through a promoting gate is allowed", () => {
  assert.deepEqual(validateSkill(makeSkill("x-flow", { routes: ["spike"], playbooks: gatedFlow })).errors, []);
});

test("a gate without promotes cannot raise a lifecycle", () => {
  const dir = makeSkill("x-flow", {
    routes: ["spike"],
    playbooks: [
      { id: "spike", lifecycle: "throwaway", exits: [["decide", "answered"]] },
      { id: "decide", kind: "gate", steps: ["[human-gate] Ask."], exits: [["build", "go"]] },
      { id: "build", lifecycle: "tracer" },
    ],
  });
  assert.ok(hasError(validateSkill(dir), /spike\.md: path to "build" raises lifecycle throwaway -> tracer/));
});

test("a gate cannot raise further than it declares", () => {
  const dir = makeSkill("x-flow", {
    routes: ["spike"],
    playbooks: [
      { id: "spike", lifecycle: "throwaway", exits: [["decide", "answered"]] },
      { id: "decide", kind: "gate", promotes: "throwaway->tracer", exits: [["prod", "go"]] },
      { id: "prod", lifecycle: "hardened" },
    ],
  });
  assert.ok(hasError(validateSkill(dir), /decide\.md: path to "prod" raises lifecycle tracer -> hardened/));
});

test("throwaway work cannot enter a tracer->hardened gate", () => {
  const dir = makeSkill("x-flow", {
    routes: ["spike"],
    playbooks: [
      { id: "spike", lifecycle: "throwaway", exits: [["release", "looks good"]] },
      { id: "release", kind: "gate", promotes: "tracer->hardened", steps: ["[human-gate] Approve."], exits: [["end", "released"]] },
    ],
  });
  assert.ok(hasError(validateSkill(dir), /arrives with throwaway work, but the gate promotes from tracer/));
});

test("promotes is only valid on gates and must raise", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["a", "b", "c"],
    playbooks: [
      { id: "a", promotes: "throwaway->tracer" },
      { id: "b", kind: "gate", promotes: "tracer->throwaway" },
      { id: "c", kind: "gate", promotes: "upwards" },
    ],
  }));
  assert.ok(hasError(r, /a\.md: only gate playbooks/));
  assert.ok(hasError(r, /b\.md: promotes tracer->throwaway does not raise/));
  assert.ok(hasError(r, /c\.md: promotes must look like/));
});

test("a gate with no job is a warning", () => {
  const r = validateSkill(makeSkill("x-flow", { routes: ["g"], playbooks: [{ id: "g", kind: "gate" }] }));
  assert.ok(hasWarning(r, /gate neither promotes a lifecycle nor stops at a \[human-gate\]/));
});

test("irreversible step needs a preceding human gate", () => {
  const bad = makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a", steps: ["Build.", "[irreversible] Deploy."] }] });
  assert.ok(hasError(validateSkill(bad), /irreversible step without a preceding \[human-gate\]/));
  const good = makeSkill("y-flow", { routes: ["a"], playbooks: [{ id: "a", steps: ["[human-gate] Confirm.", "[irreversible] Deploy."] }] });
  assert.deepEqual(validateSkill(good).errors, []);
});

// ---------- playbook body ----------

test("empty required section and missing numbered steps are errors", () => {
  const r = validateSkill(makeSkill("x-flow", { routes: ["a", "b"], playbooks: [{ id: "a", done: "" }, { id: "b", raw: playbook({ id: "b" }).replace("1. Do the thing.", "Do the thing.") }] }));
  assert.ok(hasError(r, /a\.md: "## Done when" section is empty/));
  assert.ok(hasError(r, /b\.md: "## Steps" has no numbered steps/));
});

test("unusual phase and lifecycle pair is a warning", () => {
  const r = validateSkill(makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a", phase: "explore", lifecycle: "hardened" }] }));
  assert.ok(hasWarning(r, /phase explore with lifecycle hardened is unusual/));
});

// ---------- frontmatter parser ----------

test("parser reads folded and continued exit conditions and strips comments", () => {
  const { data, problems } = parseFrontmatter(`---
id: a   # comment
title: "Keep # this"
exits:
  - to: b
    when: >
      long condition
      on two lines
  - to: end
    when: plain condition
      that continues
---
`);
  assert.deepEqual(problems, []);
  assert.equal(data.id, "a");
  assert.equal(data.title, "Keep # this");
  assert.deepEqual(data.exits, [{ to: "b", when: "long condition on two lines" }, { to: "end", when: "plain condition that continues" }]);
});

test("parser reports unsupported YAML instead of guessing", () => {
  const { problems } = parseFrontmatter("---\nexits:\n  - to: a\n    when:\n      deep: x\n\tid: a\nid: b\nid: c\n---\n");
  assert.ok(problems.some((p) => /nested structure under "when"/.test(p)));
  assert.ok(problems.some((p) => /tabs are not allowed/.test(p)));
  assert.ok(problems.some((p) => /duplicate key "id"/.test(p)));
});

test("frontmatter problems in a playbook are errors", () => {
  const raw = playbook({ id: "a" }).replace("kind: work\n", "kind: work\njust some text\n");
  const r = validateSkill(makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a", raw }] }));
  assert.ok(hasError(r, /a\.md: frontmatter line \d+/));
});

// ---------- profile ----------

test("missing profile is a warning, not an error", () => {
  const r = validateSkill(makeSkill("ok-flow", { routes: ["a"], playbooks: [{ id: "a" }] }));
  assert.deepEqual(r.errors, []);
  assert.ok(hasWarning(r, /profile\.md: missing/));
});

test("valid profile passes and is returned", () => {
  const r = validateSkill(makeSkill("ok-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: {}, skillFm: "" }));
  assert.deepEqual(r.errors, []);
  assert.ok(!hasWarning(r, /profile\.md/), r.warnings.join("\n"));
  assert.deepEqual(r.profile.journey, ["explore"]);
  assert.deepEqual(r.profile.facets, ["shared-contracts"]);
});

test("unknown facets and rails values are errors; a missing domain model is a warning", () => {
  const r = validateSkill(makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: { facets: "[web]", rails: "loose" }, skillFm: "" }));
  assert.ok(hasError(r, /`facets` value "web"/));
  assert.ok(hasError(r, /`rails` must be one of/));
  const dir = makeSkill("y-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: {}, skillFm: "" });
  fs.writeFileSync(path.join(dir, "profile.md"), fs.readFileSync(path.join(dir, "profile.md"), "utf8").replace(/## Domain model[\s\S]*/, ""));
  assert.ok(hasWarning(validateSkill(dir), /no `## Domain model` section/));
});

test("schema mismatch and invalid axis values are errors", () => {
  const newer = validateSkill(makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: { schema: SCHEMA + 1 }, skillFm: "" }));
  assert.ok(hasError(newer, /Update vajra/));
  const older = validateSkill(makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: { schema: SCHEMA - 1 }, skillFm: "" }));
  assert.ok(hasError(older, /run vajra Evolve to migrate/));
  const bad = validateSkill(makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: { cadence: "weekly", journey: "[explore, ship]" }, skillFm: "" }));
  assert.ok(hasError(bad, /`cadence` must be one of/));
  assert.ok(hasError(bad, /`journey` value "ship"/));
});

test("the router frontmatter follows the Agent Skills specification", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["a"], playbooks: [{ id: "a" }],
    skillFm: "disable-model-invocation: true\ncompatibility: Requires Node.js 18+.\nmetadata:\n  version: 1\n",
  }));
  assert.ok(hasError(r, /field `disable-model-invocation` is not in the Agent Skills specification/));
  assert.ok(hasError(r, /`metadata` must map string keys to string values/));
  assert.ok(!hasError(r, /`compatibility` must be/));
  const dir = makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a" }] });
  fs.renameSync(dir, `${dir}-renamed`);
  assert.ok(hasError(validateSkill(`${dir}-renamed`), /must match the directory name/));
});

test("explicit invocation must be stated in the description", () => {
  const r = validateSkill(makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: { invocation: "explicit" } }));
  assert.ok(hasWarning(r, /does not say to run only when invoked by name/));
  const ok = validateSkill(makeSkill("y-flow", { routes: ["a"], playbooks: [{ id: "a" }], profile: { invocation: "explicit" }, description: "Demo. Only use when the user invokes y-flow by name." }));
  assert.ok(!hasWarning(ok, /invoked by name/));
});

test("composition warnings compare the journey with the gates", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["spike"],
    playbooks: gatedFlow,
    profile: { journey: "[explore, expand, extract]", failure_cost: "customer" },
    skillFm: "",
  }));
  assert.deepEqual(r.errors, []);
  assert.ok(hasWarning(r, /journey includes extract but no gate promotes to hardened/));
  assert.ok(hasWarning(r, /no step is tagged \[irreversible\]/));
  const regulated = validateSkill(makeSkill("x-flow", {
    routes: ["spike"], playbooks: gatedFlow, profile: { journey: "[explore, expand]", failure_cost: "regulated" }, skillFm: "",
  }));
  assert.ok(hasWarning(regulated, /decide\.md: failure_cost is regulated; every promotion gate needs a \[human-gate\]/));
});

// ---------- rendering and CLI ----------

test("mermaid escapes quotes and pipes and labels promotions", () => {
  const dir = makeSkill("ok-flow", { routes: ["spike"], playbooks: gatedFlow.map((p) => (p.id === "spike" ? { ...p, exits: [["decide", 'says "yes" | maybe']] } : p)) });
  const m = toMermaid(validateSkill(dir));
  assert.ok(m.includes('-->|"says #quot;yes#quot; #124; maybe"|'));
  assert.ok(m.includes('decide{{"decide (throwaway → tracer)"}}'));
});

test("--write-graph does not write graph.md when there are errors", () => {
  const dir = makeSkill("x-flow", { routes: ["a"], playbooks: [{ id: "a", exits: [["nowhere", "always"]] }] });
  const run = spawnSync(process.execPath, [validator, dir, "--write-graph"], { encoding: "utf8" });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /graph\.md not written/);
  assert.equal(fs.existsSync(path.join(dir, "graph.md")), false);
});

test("--write-graph writes graph.md when valid", () => {
  const dir = makeSkill("ok-flow", { routes: ["a"], playbooks: [{ id: "a" }] });
  const run = spawnSync(process.execPath, [validator, dir, "--write-graph"], { encoding: "utf8" });
  assert.equal(run.status, 0);
  assert.ok(fs.readFileSync(path.join(dir, "graph.md"), "utf8").includes("```mermaid"));
});

// ---------- rails fields ----------

test("rails fields are validated", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["a", "b", "c", "d"],
    playbooks: [
      { id: "a", extra: "checks: npm test\n" },
      { id: "b", extra: "irreversible: [npm run deploy]\n" },
      { id: "c", exits: [["end", "done", "pass"]] },
      { id: "d", extra: "irreversible: [/(/]\n", steps: ["[human-gate] Ask.", "[irreversible] Deploy."] },
    ],
  }));
  assert.ok(hasError(r, /a\.md: `checks` must be a list/));
  assert.ok(hasError(r, /b\.md: declares `irreversible` commands but has no \[irreversible\] step/));
  assert.ok(hasError(r, /c\.md: exits use `on` but the playbook has no `checks`/));
  assert.ok(hasError(r, /d\.md: irreversible pattern \/\(\/ is not a valid regular expression/));
});

test("an irreversible pattern must appear in an irreversible step", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["a"],
    playbooks: [{ id: "a", extra: "irreversible: [terraform apply]\n", steps: ["[human-gate] Ask.", "[irreversible] Deploy with `make deploy`."] }],
  }));
  assert.ok(hasWarning(r, /pattern `terraform apply` appears in no \[irreversible\] step/));
});

test("a command used in steps behind different gates needs each step's own command", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["a", "b"],
    playbooks: [
      { id: "a", extra: "irreversible: [${ramp}]\n", steps: ["[human-gate] Ask.", "[irreversible] Start with `${ramp} --percent 1`.", "[human-gate] Ask again.", "[irreversible] Widen the ramp with ${ramp}."] },
      { id: "b", extra: "irreversible: [${ramp}]\n", steps: ["[human-gate] Ask.", "[irreversible] Start with `${ramp} --percent 1`.", "[human-gate] Ask again.", "[irreversible] Widen with `${ramp}`."] },
    ],
  }));
  assert.ok(hasWarning(r, /a\.md: step 4 names `\$\{ramp\}` only in prose/));
  assert.ok(hasWarning(r, /b\.md: step 2's command `\$\{ramp\} --percent 1` also fits step 4's/));
});

test("physical-world playbooks must declare what they write", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["a", "b", "c"],
    playbooks: [{ id: "a" }, { id: "b", extra: "writes: []\n" }, { id: "c", extra: "writes: [${code}]\n" }],
    profile: { facets: "[physical-world]", hardware: "attached" },
  }));
  assert.ok(hasWarning(r, /a\.md: declares no `writes`/));
  assert.ok(!hasWarning(r, /[bc]\.md: declares no `writes`/));
});

test("rails on: unguarded irreversible steps and missing checks are warnings", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["a", "b"],
    playbooks: [
      { id: "a", steps: ["[human-gate] Ask.", "[irreversible] Deploy with `make deploy`."] },
      { id: "b", lifecycle: "tracer" },
    ],
    profile: { journey: "[expand]", verification: "test-after", hardware: "attached" },
    skillFm: "",
  }));
  assert.ok(hasWarning(r, /a\.md: has \[irreversible\] steps but declares no `irreversible` command patterns/));
  assert.ok(hasWarning(r, /b\.md: verification is test-after but this kept-code playbook has no `checks`/));
  assert.ok(hasWarning(r, /hardware is attached but facets lack physical-world/));
});

// ---------- domain fit and runtime ----------

test("generic work playbooks get domain-fit warnings; concrete ones and services do not", () => {
  const r = validateSkill(makeSkill("x-flow", {
    routes: ["generic", "concrete", "svc"],
    playbooks: [
      { id: "generic", steps: ["Make sure it works."], done: "- Tests pass." },
      { id: "concrete", steps: ["Run `colcon test`."], done: "- `sim_report.json` shows 90% success." },
      { id: "svc", kind: "service", steps: ["Answer."], done: "- Answered." },
    ],
  }));
  assert.ok(hasWarning(r, /generic\.md: "Done when" names no concrete evidence/));
  assert.ok(hasWarning(r, /generic\.md: no step names a concrete command/));
  assert.ok(!hasWarning(r, /concrete\.md|svc\.md/));
});

test("a missing runtime is a warning", () => {
  const r = validateSkill(makeSkill("ok-flow", { routes: ["a"], playbooks: [{ id: "a" }] }));
  assert.ok(hasWarning(r, /runtime missing/));
});

// ---------- bindings: a skill names repository-specific values only through bindings ----------

const withBindings = (dir, text) => { fs.writeFileSync(path.join(dir, "bindings.md"), text); return dir; };

test("rails entries must use bindings; literals are errors", () => {
  const dir = withBindings(makeSkill("x-flow", {
    routes: ["a", "b"],
    playbooks: [
      { id: "a", extra: "checks:\n  - npm test\nwrites: [src/**]\n" },
      { id: "b", extra: "checks:\n  - ${test}\nwrites: [${code}/**, ${docs}]\nirreversible: [${deploy}]\n", steps: ["[human-gate] Ask.", "[irreversible] Run `${deploy}`."] },
    ],
  }), "---\ntest: command that runs the tests\ncode: source directories\ndocs: documentation globs\ndeploy: command that deploys\n---\n");
  const r = validateSkill(dir);
  assert.ok(hasError(r, /a\.md: `checks` entry `npm test` is a literal/));
  assert.ok(hasError(r, /a\.md: `writes` entry `src\/\*\*` is a literal/));
  assert.ok(!hasError(r, /b\.md/), r.errors.join("\n"));
  assert.ok(!hasWarning(r, /b\.md: irreversible pattern/), "a binding in a pattern matches the same binding in the step");
});

test("bindings must be declared with a description, and declared ones used", () => {
  const dir = withBindings(makeSkill("x-flow", {
    routes: ["a"],
    playbooks: [{ id: "a", extra: "checks:\n  - ${test}\n", steps: ["Run `${lint}`."] }],
  }), "---\ntest: command that runs the tests\nunused: something\nBad: x\nempty: \"\"\n---\n");
  const r = validateSkill(dir);
  assert.ok(hasError(r, /a\.md: binding `\$\{lint\}` is not declared in bindings\.md/));
  assert.ok(hasError(r, /bindings\.md: binding name "Bad"/));
  assert.ok(hasError(r, /bindings\.md: `empty` needs a one-line description/));
  assert.ok(hasWarning(r, /bindings\.md: `unused` is declared but no file uses/));
  assert.ok(!hasError(r, /`test`/));
});

test("repository-specific paths and URLs in prose are warnings; skill files, .flow/ and bindings are not", () => {
  const dir = withBindings(makeSkill("x-flow", {
    routes: ["a"],
    playbooks: [{
      id: "a",
      steps: ["Edit `db/migrations/` and `api/openapi.yaml`, run `./tools/check.sh`.", "Open https://staging.example.com and check `/healthz`.", "Read [the router](../SKILL.md), `.flow/x-flow/log.jsonl`, `${data}/train.csv`, pass/fail."],
    }],
    description: "Use from ~/work/acme.",
  }), "---\ndata: dataset directory\n---\n");
  const r = validateSkill(dir);
  const w = r.warnings.find((x) => x.startsWith("playbooks/a.md")) || "";
  for (const hit of ["db/migrations/", "api/openapi.yaml", "./tools/check.sh", "https://staging.example.com", "/healthz"]) assert.ok(w.includes(`\`${hit}\``), hit);
  for (const fine of ["SKILL.md", ".flow/", "train.csv", "pass/fail"]) assert.ok(!w.includes(fine), fine);
  assert.ok(hasWarning(r, /SKILL\.md: `~\/work\/acme` looks repository-specific/));
});

test("--project checks that the project binds every name", () => {
  const dir = withBindings(makeSkill("bind-flow", { routes: ["a"], playbooks: [{ id: "a", extra: "checks:\n  - ${test}\n  - ${lint}\n" }] }), "---\ntest: tests\nlint: linter\n---\n");
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "lg-proj-"));
  assert.ok(hasError(validateSkill(dir, { project: proj }), /project\.md: missing; bind test, lint there/));
  fs.mkdirSync(path.join(proj, ".flow", "bind-flow"), { recursive: true });
  fs.writeFileSync(path.join(proj, ".flow", "bind-flow", "project.md"), "---\ntest: pnpm test\nlint: \"\"\nextra: x\n---\n");
  let r = validateSkill(dir, { project: proj });
  assert.ok(hasError(r, /no value for `lint`/));
  assert.ok(hasWarning(r, /`extra` is not declared/));
  fs.writeFileSync(path.join(proj, ".flow", "bind-flow", "project.md"), "---\ntest: pnpm test\nlint: [pnpm lint, pnpm typecheck]\n---\n");
  r = validateSkill(dir, { project: proj });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.project.values, { test: ["pnpm test"], lint: ["pnpm lint", "pnpm typecheck"] });
  const run = spawnSync(process.execPath, [validator, "--project", proj, dir], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stdout);
});
