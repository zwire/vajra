# Consult: grill the plan before building it

A consulting session that questions the user hard to find the workflow they actually need, not the one they first described. Used as a step inside [generate.md](generate.md) and [evolve.md](evolve.md), or on its own when the user wants advice before generating anything ("what workflow do I need for…?").

The point is optimality: every playbook, gate, facet and rail in the final skill should survive a direct challenge. Process that cannot justify itself gets cut; risks the user did not mention get surfaced.

## Rules

- **Ask in short rounds.** A round is at most four questions that do not depend on each other; wait for its answers before the next round, because each answer can change which question matters next. Most sessions need two or three rounds.
- **Always recommend, and make the recommendation the default.** Every question carries your recommended answer and a one-line reason, pre-selected, so accepting all of them takes one action ("ok", Enter, or Send).
- **Offer choices, not blank fields.** Turn every question into 2–4 concrete options in the user's words. For open questions (evidence, commands, vocabulary), draft the answer from the repository and ask the user to confirm or edit it.
- **Use the lightest surface the agent has.** See [Answer surfaces](#answer-surfaces).
- **Walk the decision tree.** Resolve the questions that other decisions depend on first (domain and hardware before gates; journey before lifecycles; failure cost before review depth).
- **Challenge both directions.** Ask "do you really need this?" about heavy process, and "what happens when this goes wrong?" about missing safeguards.
- **Use evidence first.** If the repository or earlier answers already answer a question, state the answer and move on instead of asking.
- **Stop when nothing graph-changing remains**, or when the user says "enough", "go", or similar. Then use your recommendations for every open question and list them as assumptions.
- **Never more than 15 questions** in one session. If you reach that, summarize and propose the graph anyway.

## Steps

1. **Restate** the declaration and the draft profile (inferred values with evidence) in a few lines. Mark which axes are uncertain.
2. **Build the question queue** from:
   - Uncertain profile axes that change the graph ([../references/style-profile.md](../references/style-profile.md#interview-question-bank)).
   - The domain model: draft it from the repository ([../references/domain-model.md](../references/domain-model.md)), then the open questions of each facet that may apply ([../references/facets/](../references/facets/README.md)). Refine only while answers change the graph.
   - The challenge questions below.
   Order it so dependencies come first. Drop questions whose answer would not change the graph.
3. **Grill** in rounds, following the rules above and [Answer surfaces](#answer-surfaces). After each round, update the draft profile and re-order the queue.
4. **Propose the skill set.** Present the playbooks you intend to generate, grouped as spine, services, gates and domain playbooks, each with one line of justification tied to a profile value. Also list what you considered and dropped, with the reason.
5. **Challenge round.** Ask once: "Anything here you would never actually run, or anything you expected that is missing?" Apply the answer.
6. **Record** the final profile, the assumptions, and a short consult log (question, answer, effect on the graph) in the generated skill's `profile.md` under `## Consult log`.

## Answer surfaces

Pick the first one that works in the current agent and session. The questions, options and recommendations are the same on every surface; only the rendering changes.

1. **The agent's own structured question tool.** If the agent has a built-in tool that asks the user multiple-choice questions (an ask-user or question tool that shows options as buttons, or an MCP elicitation form), ask each round through it. List the recommended option first and add "(recommended)" to its label. Leave a free-text "other" answer open when the tool allows it.
2. **A one-page form**, for a round with more than four questions (for example the restated profile, with every inferred axis as a pre-filled choice the user only corrects) or when no structured tool exists but the user can open a browser. Write the round as a spec in the system temp directory (format: [../templates/interview-round.json](../templates/interview-round.json)), then:
   - `node scripts/interview.mjs serve <round.json> --open` when the agent runs on the user's machine. It serves the form on `127.0.0.1`, opens the browser, and prints the answers as JSON when the user presses Send. Run it with a timeout the agent's shell allows (`--timeout <s>`, default 900); exit code 4 means nobody answered.
   - `node scripts/interview.mjs html <round.json> --open` when the agent cannot wait on a local server (a remote or sandboxed session the user's browser cannot reach, or a shell that cannot block). The form copies the answers as one line of JSON for the user to paste back.
   Say in one line what the form is for and that pressing Send without changes accepts every recommendation.
3. **Plain text**, everywhere else. Print the round with `node scripts/interview.mjs text <round.json>`, or write the same shape by hand: numbered questions, lettered options, the recommendation marked with its reason, and the closing line *Reply "ok" to take every recommendation, or only what differs (for example "2b").*

Accept partial answers on every surface: anything the user leaves alone keeps its recommendation. Never ask the user which surface they want.

## Challenge questions

Pick the ones that apply; skip the rest.

**Necessity**
- "You mentioned ⟨process⟩. What went wrong last time without it?" If nothing, propose dropping it.
- "Would you actually run ⟨playbook⟩, or is it there because projects are supposed to have one?"
- "Who besides you reads ⟨artifact⟩?" If nobody, simplify it.

**Risk**
- "What is the worst thing this project can break, and how fast would you notice?"
- "Which step, if done wrong, cannot be undone?" (Each answer becomes an `[irreversible]` step with a human gate.)
- "If this prototype works, will someone be tempted to ship it as is?" (If yes, `decide` must enforce rebuild.)

**Phase**
- "Six months from now, is this still an experiment, a product people use, or infrastructure others build on?"
- "What would tell you it is time to stop exploring and start hardening?"

**Domain and hardware**
- "If I wrote 'tests pass' as the proof here, what would you actually want to see instead?"
- "Is there a simulator, emulator or replay cheaper than the real thing?"
- "What lead times exist outside the code (hardware, data collection, approvals, store review)?"
- "What does the smallest convincing evidence look like in this domain?"

**Fit**
- "Which part of your current workflow do you skip most often, and why?"
- "Where do you lose the most time today?"

## Output when run on its own

When consult is run without generating, end with:

- The recommended profile (axes, facets, rails) and the domain model.
- The proposed playbook list with justifications, and what was dropped.
- The open assumptions.
- An offer to generate the skill from this result.
