# Consult: grill the plan before building it

A consulting session that questions the user hard to find the workflow they actually need, not the one they first described. Used as a step inside [generate.md](generate.md) and [evolve.md](evolve.md), or on its own when the user wants advice before generating anything ("what workflow do I need for…?").

The point is optimality: every playbook, gate, facet and rail in the final skill should survive a direct challenge. Process that cannot justify itself gets cut; risks the user did not mention get surfaced.

## Rules

- **One question at a time.** Wait for the answer before asking the next. Each answer can change which question matters next.
- **Always recommend.** Every question carries your recommended answer and a one-line reason, so the user can reply "yes" and move on.
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
3. **Grill**, one question per message, following the rules above. After each answer, update the draft profile and re-order the queue.
4. **Propose the skill set.** Present the playbooks you intend to generate, grouped as spine, services, gates and domain playbooks, each with one line of justification tied to a profile value. Also list what you considered and dropped, with the reason.
5. **Challenge round.** Ask once: "Anything here you would never actually run, or anything you expected that is missing?" Apply the answer.
6. **Record** the final profile, the assumptions, and a short consult log (question, answer, effect on the graph) in the generated skill's `profile.md` under `## Consult log`.

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
