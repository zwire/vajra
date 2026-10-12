# Domain model

The domain model says what the work inside each playbook actually is: what proves a step is done, what the cheap experiment looks like, what cannot be undone, and which tools and words the user uses. It is built fresh for each user. There are no presets, because the resolution that matters differs: "image processing" means one thing for a photo filter in a consumer app and another for a medical imaging classifier.

## Resolution: refine only while it changes the graph

Start with one area covering the whole project. Split it into areas only when parts of the work differ in facets, evidence or irreversible actions (perception vs motion control on a robot; ranking model vs serving path in search). Stop refining a question as soon as the answer would not change a playbook, an exit, a gate, a check or a guarded command. Two to four areas is typical; one is fine.

## What to pin down

For each area, in the user's terms:

| Field | Question | Example (robot grasping, perception area) |
|---|---|---|
| Facets | Which [facets](facets/README.md) apply here? | data-dependence, measured-outcome, stand-in-ladder |
| Smallest convincing evidence | What output would make a skeptical teammate agree it works? | precision and recall on held-out set `v7`, grasp success over 50 sim trials |
| Evidence ladder | Cheapest to most real, with the command for each rung | `colcon test` replay of bags → Gazebo scenarios → supervised arm trial |
| Cheap experiment | What does throwaway work look like, and where does it live? | notebook on recorded bags in `scratch/` |
| Irreversible actions | What cannot be undone, and the exact commands | `ros2 launch grasp_bringup real.launch.py`, evaluating on held-out `v7` |
| Lead times | What waits on people, hardware or other organizations? | lab booking for the arm, one day |
| Tools and vocabulary | Real tool names, file types, and the user's words | ROS 2, bags, Gazebo, "spike notes" |

## Specificity rules

The generated skill must read as if written by someone who works in this domain. Before writing files, and again before handing over:

1. **Name real things.** Every playbook step that produces or checks something names the actual command, tool, file, metric, device or service. "Run the tests" becomes "`colcon test && colcon test-result --verbose`".
2. **Evidence is domain evidence.** "Done when" names what a practitioner in this field would accept: golden frames, p95 latency on the staging cluster, a reconciled row count, a trial video. "Tests pass" and "it works" are not evidence.
3. **The swap test.** For each playbook, ask: would this text read the same in a different domain? If yes, it is still a blueprint. Rewrite it with the domain model, or justify why it is genuinely generic (some services are).
4. **Unknowns become questions.** If you cannot name the concrete thing, ask the user or look in the repository. Do not paper over it with general wording.
5. **Prefer the user's words** over textbook terms ("bag" over "recorded sensor data" when they say bag).

The validator warns when a work or gate playbook's "Done when" or steps name nothing concrete (no command, path, metric or link). Treat each warning as a failed swap test.

## Deriving it

During the consult, after the style axes:

1. Read the repository for tools, configs, data directories, simulators, deploy targets.
2. State a draft domain model with areas and facets, marking what you inferred and from where.
3. Ask the facets' questions that remain open, one at a time, dependencies first (areas before evidence, evidence before gates).
4. Write the result into `profile.md`: `facets` in the frontmatter, the table above under `## Domain model`.

For calibration, read [calibration.md](calibration.md). It shows the level of concreteness expected, not domains to copy.
