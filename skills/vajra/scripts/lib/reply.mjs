// The human answers a question the rails ask (may a [human-gate] pass, may the rails be suspended)
// by picking one of its choices: in the agent's choice dialog (ask.mjs), in an elicitation dialog
// (mcp.mjs), or in the chat by its number or its name, with anything after it kept as a note
// ("1", "approve, ship it", "2: not today"). Nothing else in a message is read, so nothing is guessed.

export const GATE = ["Approve", "Reject"];
export const SUSPEND = ["Suspend", "Reject"];

// The choice a message picks, as { choice, rest }, or null. Numbers can be turned off when two
// questions wait at once and "1" would not say which.
export function pick(text, choices, { numbers = true } = {}) {
  const t = String(text ?? "").normalize("NFKC").trim();
  for (const [i, c] of choices.entries()) {
    const m = t.match(new RegExp(`^(?:${numbers ? `${i + 1}|` : ""}${c})(?:[\\s:,.!)-]+([\\s\\S]*))?$`, "i"));
    if (m) return { choice: c, rest: (m[1] || "").trim() };
  }
  return null;
}

// What the human wrote in a prompt. A host that relays the human's message to the agent may wrap
// it, along with other sessions' messages and its own notes; Claude's Projects threads send
// <wake ...><message trigger="true" from="human" ...>text</message>...</wake>. Only the one
// message the host marks as the human's, and as this turn's trigger, is theirs. A wrapper with no
// such message holds nothing of theirs; a prompt with no wrapper is all theirs.
const ENTITIES = { lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" };
export function humanText(prompt) {
  const p = String(prompt ?? "");
  if (!/^\s*<wake\b/.test(p)) return p;
  const own = [...p.matchAll(/<message\b([^>]*)>([\s\S]*?)<\/message>/g)].filter(([, a]) => /\bfrom="human"/.test(a) && /\btrigger="true"/.test(a));
  if (own.length !== 1) return "";
  // Without its child elements (an edited message carries its <previous-body>).
  return own[0][2].replace(/<([\w-]+)\b[^>]*>[\s\S]*?<\/\1>/g, "").replace(/&(lt|gt|quot|apos|amp);/g, (_, e) => ENTITIES[e]).trim();
}

// A prompt the agent hands to another session must not pick a choice there (see protect.mjs),
// read as that session's hooks would read it.
export const readsAsReply = (text) => !!(pick(humanText(text), GATE) || pick(humanText(text), SUSPEND));

const listed = (choices) => choices.map((c, i) => `${i + 1}. ${c}`).join("  ");
const asChoice = (choices) => `as a choice: with your choice tool if you have one (Claude Code: AskUserQuestion with exactly the options ${choices.join(" and ")}, and no answers of your own), otherwise by ending your message with "${listed(choices)}". The user picks one; only their pick counts`;
export const askAtGate = (n = "<n>") => `ask the user whether step ${n} may pass, ${asChoice(GATE)}`;
export const askSuspend = `ask the user whether to suspend the rails for that, ${asChoice(SUSPEND)}`;
