// How the agent asks the user a question only they can answer (may a [human-gate] pass, may the
// rails be suspended), and records the answer. The agent asks with its choice dialog or buttons
// where it has them, and the user taps a choice or answers in their own words. The agent records
// what they meant with `flow answer`. The rails never read the words: they accept an answer only
// once the user has replied since the question was asked (flow.mjs keeps their messages and picks),
// so the agent cannot answer before the user has. Each hint while a question waits says to record a
// reply that came, so a reply is never asked for twice.

const tool = (choices) => `with your tool for putting choices to the user (a dialog or buttons: ${choices}), in plain words only if you have none, and end your turn`;
const record = (f, yes, no) => `record what they meant, however they put it, with \`${f} answer ${yes}\` or \`${f} answer ${no} --note "<why>"\``;
export const askAtGate = (n = "<n>", f = "flow") => `ask the user whether step ${n} may pass ${tool("Approve / Reject")}. When they answer, ${record(f, "approve", "reject")}`;
export const askSuspend = (f = "flow") => `ask the user whether to suspend the rails for that ${tool("Suspend / Keep the rails on")}. When they answer, ${record(f, "suspend", "decline")}`;
const waiting = (rec, ask) => `if the user has answered since you asked (a reply or a choice), ${rec} now, without asking again; if not, ${ask}`;
export const awaitGate = (n = "<n>", f = "flow") => waiting(record(f, "approve", "reject"), askAtGate(n, f));
export const awaitSuspend = (f = "flow") => waiting(record(f, "suspend", "decline"), askSuspend(f));
