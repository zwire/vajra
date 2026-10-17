// The opt-in MCP server (stdio, JSON-RPC 2.0, newline-delimited).
// Tools mirror the agent commands. There is deliberately no tool to approve: at a [human-gate]
// the server asks the human through MCP elicitation, which the client shows to the user and the
// model cannot answer. Clients without elicitation fall back to chat or terminal approval.

import { skillName } from "./env.mjs";
import { VERSION } from "./contract.mjs";
import { openStore } from "./store.mjs";
import { approve, reject } from "./run.mjs";
import { execute } from "./cli.mjs";

const MCP_TOOLS = [
  ["flow_status", "Show the active playbook, its steps, checks, open exits and the next move.", {}, []],
  ["flow_start", "Start a run at a router entry playbook.", { playbook: "string", request: "string", abandon: "string" }, ["playbook", "request"]],
  ["flow_step", "Record step n with evidence, or skip it with a reason. On a [human-gate] step, asks the human.", { n: "integer", evidence: "string", skip: "string" }, ["n"]],
  ["flow_finish", "Finish the playbook: needs every step recorded; runs its checks and lists the open exits.", { evidence: "string" }, ["evidence"]],
  ["flow_exit", "Take an open exit; the next playbook starts.", { to: "string", because: "string" }, ["to", "because"]],
  ["flow_pause", "Pause the run with a handoff note before stopping mid-playbook.", { note: "string" }, ["note"]],
  ["flow_resume", "Resume a paused run.", {}, []],
  ["flow_log", "Show the recent run events.", {}, []],
].map(([name, description, props, required]) => ({
  name,
  description,
  inputSchema: { type: "object", properties: Object.fromEntries(Object.entries(props).map(([k, t]) => [k, { type: t }])), required },
}));

export function serveMcp(root, input = process.stdin, output = process.stdout) {
  let clientElicits = false;
  let nextId = 1;
  const pending = new Map();
  const send = (msg) => output.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
  const ask = (method, params) => new Promise((resolve) => { const id = `flow-${nextId++}`; pending.set(id, resolve); send({ id, method, params }); });

  async function callTool(name, a) {
    const cmd = name.replace(/^flow_/, "");
    const pos = cmd === "start" ? [a.playbook] : cmd === "step" ? [String(a.n)] : cmd === "exit" ? [a.to] : [];
    const o = { request: a.request, abandon: a.abandon, evidence: a.evidence, skip: a.skip, because: a.because, note: a.note };
    for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
    let r = execute(cmd, pos, o, root);
    if (r.code === 3 && clientElicits) {
      const res = await ask("elicitation/create", {
        mode: "form",
        message: `${skillName}: ${r.text.split("\n")[0].replace(/^STOP\. /, "")}`,
        requestedSchema: {
          type: "object",
          properties: {
            decision: { type: "string", title: "Decision", enum: ["approve", "reject"] },
            note: { type: "string", title: "Note (optional)" },
          },
          required: ["decision"],
        },
      });
      const st = openStore(root);
      const state = st.load();
      const decided = res?.action === "accept" ? res.content?.decision : res?.action === "decline" ? "reject" : null;
      if (decided && state.run?.awaiting) {
        const n = decided === "approve" ? approve(state, "the user (elicitation)", res.content?.note) : reject(state, "the user (elicitation)", res.content?.note || "declined");
        st.save(state);
        st.log({ event: decided, run: state.run.id, playbook: state.run.playbook, step: n, by: "elicitation" });
        r = { code: 0, text: `The user ${decided === "approve" ? "approved" : "rejected"} step ${n}.\n${execute("status", [], {}, root).text}` };
      } else r = { code: 3, text: `${r.text}\n(The user dismissed the request; the gate is still waiting.)` };
    }
    return { content: [{ type: "text", text: r.text }], isError: r.code === 1 || r.code === 2 };
  }

  async function handle(msg) {
    if (msg.id !== undefined && !msg.method) { const res = pending.get(msg.id); pending.delete(msg.id); res?.(msg.result); return; }
    const { id, method, params = {} } = msg;
    try {
      if (method === "initialize") {
        clientElicits = !!params.capabilities?.elicitation;
        return send({ id, result: {
          protocolVersion: params.protocolVersion || "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: skillName, version: VERSION },
          instructions: `Drive every run of the ${skillName} workflow through these tools: flow_start, flow_step, flow_finish, flow_exit. Call flow_status whenever unsure.`,
        } });
      }
      if (method === "ping") return send({ id, result: {} });
      if (method === "tools/list") return send({ id, result: { tools: MCP_TOOLS } });
      if (method === "tools/call") return send({ id, result: await callTool(params.name, params.arguments || {}) });
      if (id !== undefined) send({ id, error: { code: -32601, message: `method not found: ${method}` } });
    } catch (e) {
      if (id !== undefined) send({ id, error: { code: -32603, message: String(e.message || e) } });
    }
  }

  let buf = "";
  input.setEncoding("utf8");
  input.on("data", (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { send({ id: null, error: { code: -32700, message: "parse error" } }); continue; }
      handle(msg);
    }
  });
}
