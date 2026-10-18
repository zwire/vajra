// Reading the human's answer to a question the rails asked (a [human-gate], or the agent's request
// to suspend the rails) from their own words, so they can answer as they would anyone: "yes, go
// ahead", "LGTM", "いいよ、進めて", "no, not today". Only the human's prompt (or their pick in a choice
// dialog) is read this way; nothing the agent writes reaches it (see protect.mjs for prompts the
// agent hands to another session).
// A wrong "yes" passes a gate, so the reading leans to no answer: the message must open with a
// clear yes or no, and a yes must not be hedged, conditioned or asked back anywhere in the message.
// No answer leaves the question waiting, and the agent asks again.

// Whole phrases that answer yes or no; a clause answers only if it is made of them alone.
const YES = [
  "yes", "yeah", "yep", "yup", "y", "sure", "ok", "okay", "okey", "fine", "alright", "all right",
  "approve", "approved", "i approve", "lgtm", "looks good", "looks good to me", "looks great", "sounds good", "good to go",
  "go", "go ahead", "go for it", "go on", "proceed", "continue", "carry on", "do it", "ship it", "let's go", "lets go",
  "let's do it", "agreed", "confirmed", "confirm", "granted", "accepted", "no problem", "no worries", "perfect",
  "great", "good", "nice", "cool", "absolutely", "definitely", "sure thing", "of course", "please", "please do", "please go ahead",
  "thanks", "thank you", "then", "and",
  "はい", "うん", "ええ", "おk", "おけ", "おっけ", "おっけー", "オッケー", "オーケー", "ok です", "いいよ", "いいです",
  "いいですよ", "いいね", "いいと思う", "いいと思います", "良い", "良いです", "よい", "よし", "大丈夫", "大丈夫です",
  "問題ない", "問題ないです", "問題なし", "問題ありません", "了解", "了解です", "了解しました", "承知しました",
  "承認", "承認します", "承認です", "許可", "許可します", "どうぞ", "お願い", "お願いします", "おねがいします",
  "よろしく", "よろしくお願いします", "進めて", "進めてください", "進めて下さい", "進めていいよ", "進めていいです",
  "進めてok", "進めて大丈夫", "進んで", "進んでください", "続けて", "続けてください", "やって", "やってください",
  "実行して", "実行してください", "それで", "それでいい", "それでいいよ", "それでお願いします", "ゴー", "賛成", "同意",
  "同意します", "ありがとう", "ありがとうございます", "では", "じゃあ", "じゃ",
  "👍", "✅", "👌", "🆗", "🙆", "🙆‍♂️", "🙆‍♀️",
];
const NO = [
  "no", "nope", "nah", "n", "reject", "rejected", "i reject", "deny", "denied", "decline", "declined",
  "don't", "dont", "do not", "don't do it", "do not do it", "do not proceed", "don't proceed", "stop", "cancel",
  "abort", "not ok", "not okay", "no way", "not approved", "never",
  "いいえ", "だめ", "ダメ", "駄目", "だめです", "ダメです", "駄目です", "却下", "却下します", "却下で", "拒否",
  "拒否します", "不可", "ng", "やめて", "やめてください", "やめよう", "やめ", "止めて", "止めてください", "中止",
  "中止して", "中止します", "しないで", "しないでください", "やらないで", "やらないでください", "進めないで",
  "進めないでください", "反対",
  "👎", "❌", "🙅", "🙅‍♂️", "🙅‍♀️", "🚫",
];
// Words that may stand around the answer: "ok then", "yes please", "はい、お願いします".
const FILLER = new Set(["please", "thanks", "thank you", "then", "and", "ありがとう", "ありがとうございます", "では", "じゃあ", "じゃ"]);

const norm = (s) => String(s ?? "").normalize("NFKC").toLowerCase().replace(/[’`]/g, "'").trim();
// Longest first, so "go ahead" is read before "go".
const phrases = (list) => [...new Set(list.map(norm))].sort((a, b) => b.length - a.length);
const YES_P = phrases(YES);
const NO_P = phrases(NO);
const JAPANESE = /[぀-ヿ㐀-鿿]/;

// Whether the clause is made only of the phrases (and filler), and holds at least one real one.
function madeOf(clause, list) {
  let s = clause;
  let real = false;
  while (s) {
    const p = list.find((x) => s.startsWith(x) && (JAPANESE.test(x) || /^[^a-z0-9']/.test(s.slice(x.length)) || s.length === x.length));
    if (!p) return false;
    if (!FILLER.has(p)) real = true;
    s = s.slice(p.length).replace(/^[\s~〜ー!！]+/, "").replace(/^(よ|ね|な|です|だ|っす)(?![぀-ヿ])/, "").trim();
  }
  return real;
}

// Clause boundaries; a question mark is kept so a clause that asks is never an answer.
const CLAUSE = /[,，、.。;；:：\n!！…]+|\s+-+\s+|(?<=[?？])/;
// A yes is held back by any of these in the rest of the message: a question, a negation, a
// condition, a "but", or a wait.
const HEDGE_EN = /[?？]|\b(not|no|don't|dont|wait|hold|but|however|unless|if|except|only|first|before|after|stop|cancel|reject|never|later|yet|maybe|actually|instead|why|what|how|which|hmm+|tomorrow|tonight|let me|i'll|i will|i need|need to|check|look|think|review|test|once|when|until|as soon as|sec|second|moment|minute|hang on)\b|n't\b/;
const HEDGE_JA = /[?？]|ない|ません|ず$|待|まだ|止|やめ|ダメ|だめ|駄目|却下|拒否|けど|けれど|でも|ただ|しかし|が(\s|$)|なら|たら|れば|前に|先に|後で|あとで|代わり|かな|かも|か$|どう|なぜ|なんで|明日|から$|確認|考え|検討|見て|相談/;
const hedged = (rest) => rest.length > MAX_REST || HEDGE_EN.test(rest) || HEDGE_JA.test(rest);
// A no is held back by a yes in the rest ("no, go ahead"), which leaves it unclear.
const YES_LATER = /\b(go ahead|proceed|approve|lgtm|do it|ship it|fine)\b|進めて|いい(よ|ね|です|と思)|大丈夫|承認|問題ない|お願いします/;
const MAX_REST = 300;
const NONE = { answer: null, rest: "" };

// The first clause of a message, lowercased for matching, and the rest as written.
function clauses(raw) {
  const t = raw.normalize("NFKC");
  const m = CLAUSE.exec(t);
  const first = norm(m ? t.slice(0, m.index) : t);
  const rest = m ? t.slice(m.index + m[0].length).replace(/^[\s,，、.。;；:：!！…-]+/, "").trim() : "";
  return { first, rest, low: norm(rest) };
}

// The answer in a message: { answer: "yes" | "no" | null, rest } where rest is the text after the
// answer (a note or a reason). The explicit words keep their meaning: "approve, ship it" approves
// with that note and "reject: not today" rejects with that reason, but "approve, but only on
// staging" is a condition the rails cannot hold the agent to, so it is no answer.
export function readReply(text) {
  const raw = String(text ?? "").trim();
  const word = raw.match(/^(approve|reject)(?:[\s:,.!-]+([\s\S]*))?$/i);
  if (word) {
    const rest = (word[2] || "").trim();
    if (word[1].toLowerCase() === "reject") return { answer: "no", rest };
    return hedged(norm(rest)) ? NONE : { answer: "yes", rest };
  }
  const { first, rest, low } = clauses(raw);
  if (!first || /[?？]/.test(first)) return NONE;
  // A trailing "..." is a hesitation, not a yes.
  if (madeOf(first, YES_P)) return hedged(low) || /…|\.{2,}|‥/.test(raw) ? NONE : { answer: "yes", rest };
  if (madeOf(first, NO_P)) return YES_LATER.test(low) ? NONE : { answer: "no", rest };
  return NONE;
}

// Suspending turns every check off, so a yes counts for it only when it names the suspension
// ("yes, suspend", "中断していいよ"): an agent that asked for it while talking about something else
// cannot take an ordinary "ok" for it. `suspend` on its own still answers, as before.
export const NAMES_SUSPEND = /suspend|サスペンド|中断|一時停止/i;
export function readSuspendReply(text) {
  const raw = String(text ?? "").trim();
  const word = raw.match(/^suspend(?:[\s:,.!-]+([\s\S]*))?$/i);
  if (word) return hedged(norm(word[1] || "")) ? NONE : { answer: "yes", rest: (word[1] || "").trim() };
  const stripped = raw.replace(/suspend(\s+the\s+rails)?|(レールを?)?(サスペンド|中断|一時停止)(しても|して|する|で)?/gi, " ").replace(/\s+/g, " ").trim();
  // What is left once the suspension is named: "please suspend" leaves only a filler word.
  const left = norm(stripped).replace(/^[\s,，、.。!！]+|[\s,，、.。!！]+$/g, "");
  const r = readReply(!left || FILLER.has(left) ? "ok" : stripped);
  if (r.answer === "yes" && (!NAMES_SUSPEND.test(raw) || /^approve\b/i.test(raw))) return NONE;
  return r;
}

// Whether a prompt the agent would hand to another session reads as an answer, which the rails
// would take as the human's there.
export const readsAsReply = (text) => /^\s*(approve|reject|suspend)(?![\w-])/i.test(String(text)) || readReply(text).answer !== null || readSuspendReply(text).answer !== null;

// How the agent asks the user to pass a gate. The user answers in their own words or with a tap in
// the agent's choice dialog; hooks read either (reply.mjs, ask.mjs), and only the user's counts.
export const askAtGate = (n = "<n>") => `ask the user one yes-or-no question: may step ${n} pass? They answer in their own words ("yes, go ahead", "no, because ..."), or by a tap if you can show choices (Claude Code: AskUserQuestion, with a question that names step ${n}, the options Approve and Reject, and no answers of your own). Only their answer counts, and it waits until they give it`;
