# Domain model

The domain model says what the work inside each playbook actually is: what proves a step is done, what the cheap experiment looks like, what cannot be undone, and which tools and words the user uses. It is built fresh for each user. There are no presets, because the resolution that matters differs: "image processing" means one thing for a photo filter in a consumer app and another for a medical imaging classifier.

## Resolution: refine only while it changes the graph

Start with one area covering the whole project. Split it into areas only when parts of the work differ in facets, evidence or irreversible actions (perception vs motion control on a robot; ranking model vs serving path in search). Stop refining a question as soon as the answer would not change a playbook, an exit, a gate, a check or a guarded command. Two to four areas is typical; one is fine.

## What to pin down

For each area, in the user's terms:

| Field | Question | Example (robot grasping, perception area) |
|---|---|---|
| Facets | Which [facets](facets/README.md) apply here? | data-dependence, measured-outcome, stand-in-ladder |
| Smallest convincing evidence | What output would make a skeptical teammate agree it works? | precision and recall on the held-out set `${heldout}`, grasp success over 50 sim trials |
| Evidence ladder | Cheapest to most real, with the command for each rung | `${perception-test}` replay of bags → Gazebo scenarios → supervised arm trial |
| Cheap experiment | What does throwaway work look like, and where does it live? | notebook on recorded bags in `${scratch}` |
| Irreversible actions | What cannot be undone, and the exact commands | launching the real arm with `${real-launch}`, evaluating on the held-out set with `${heldout-eval}` |
| Lead times | What waits on people, hardware or other organizations? | lab booking for the arm, one day |
| Tools and vocabulary | Real tool names, file types, and the user's words | ROS 2, bags, Gazebo, "spike notes" |

## Domain or project?

The domain model describes a kind of work, so it holds for every repository of that kind. What belongs to one repository is a [binding](graph-model.md#bindings), and its value goes in the project file `.flow/<skill>/project.md`:

| In the skill (domain) | In the project file (one repository) |
|---|---|
| Tools and their roles: ROS 2, Gazebo, colcon, Postgres migrations, an OpenAPI spec | The commands that run them here: `colcon test --packages-select grasp_perception`, `pnpm db:migrate` |
| Evidence and its thresholds when they are the team's rule: "grasp success over 50 sim trials" | Paths, globs and files: the dataset directory, the launch file, `db/migrations/`, `api/openapi.yaml` |
| Vocabulary: "bag", "story", "QA sign-off" | URLs, endpoints, dashboards, tracker keys, branch names, service budgets of one system |

Ask of every concrete value: would it be the same if this team ran the same workflow in their next repository? If yes, it stays in the skill. If not, write `${name}` and record the value in the project file.

## Specificity rules

The generated skill must read as if written by someone who works in this domain. Before writing files, and again before handing over:

1. **Name real things.** Every playbook step that produces or checks something names the actual command, tool, file, metric, device or service, through a binding when the value belongs to one repository. "Run the tests" becomes "Run `${test}` (colcon) and read `colcon test-result --verbose`", with `test: colcon test --packages-select grasp_perception` in the project file.
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
4. Write the result into `profile.md`: `facets` in the frontmatter, the table above under `## Domain model`, with repository values as bindings. Write the values, and the evidence each was inferred from, into the project file.

For calibration, read [calibration.md](calibration.md). It shows the level of concreteness expected, not domains to copy.
