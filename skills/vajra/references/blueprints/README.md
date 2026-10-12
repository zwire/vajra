# Blueprints

Playbook blueprints: one file per blueprint, each already in the [playbook frontmatter contract](../graph-model.md#playbook-frontmatter-contract), so a selected blueprint can be copied into `playbooks/` and edited in place. The test suite checks that the whole library forms a valid graph.

When generating:

1. Copy only the blueprints [composition](../composition.md) selected.
2. Rename steps into the user's vocabulary and fill the parameters (`⟨…⟩`) from the profile. A `⟨[human-gate] …⟩` placeholder becomes a real `[human-gate]` step only when its condition holds.
3. Delete steps the profile does not need, and exits whose target was not selected (redirect them if work still continues).
4. Add `## Parameters` and `## Reply with` sections as [authoring](../authoring.md) describes.

## Index

| Group | Blueprint | Phase · lifecycle · kind | Purpose |
|---|---|---|---|
| Explore | [frame-the-question](frame-the-question.md) | explore · throwaway · work | Turn a vague goal into one decision-changing question |
| | [spike](spike.md) | explore · throwaway · work | Answer one technical question; the output is knowledge |
| | [prototype](prototype.md) | explore · throwaway · work | Settle a design question by trying alternatives cheaply |
| | [poc](poc.md) | explore · throwaway · work | Show feasibility against criteria agreed in advance |
| | [mvp-experiment](mvp-experiment.md) | explore · throwaway · work | Test a value hypothesis with real users |
| | [stabilize](stabilize.md) | any · any · work | Contain a chaotic situation first, understand later |
| Gates | [decide](decide.md) | gate, throwaway → tracer | Go, explore further, or stop; rebuild instead of promoting code |
| | [promote-to-production](promote-to-production.md) | gate, tracer → hardened | Evidence checklist scaled to failure cost |
| | [release-gate](release-gate.md) | gate, tracer → hardened | Go / no-go for plan-driven or QA-led releases |
| Build (iterative) | [tracer-bullet](tracer-bullet.md) | expand · tracer · work | Thinnest end-to-end path in the real architecture |
| | [slice](slice.md) | any · any · work | Cut the next piece of work in a flow cadence |
| | [increment](increment.md) | expand · tracer · work | Deliver one slice of behavior |
| | [ship](ship.md) | any · any · work | Merge and deploy behind a human gate |
| Build (sprint) | [sprint-planning](sprint-planning.md) | any · any · work | Commit to a sprint goal |
| | [sprint-review](sprint-review.md) | any · any · work | Show the increment, collect feedback |
| | [retro](retro.md) | any · any · work | Turn experience into structural change, including Evolve |
| Build (plan-driven) | [requirements](requirements.md) | any · any · work | Fixed requirements with ids |
| | [design](design.md) | any · any · work | Design paired with its tests (V-model) |
| | [build-to-spec](build-to-spec.md) | expand · tracer · work | Implement the design test-first |
| | [verify-against-spec](verify-against-spec.md) | extract · tracer · work | Verify every requirement |
| Quality and operations | [harden](harden.md) | expand · tracer · work | Raise kept code to production quality |
| | [production-readiness](production-readiness.md) | extract · tracer · work | Production readiness review |
| | [qa-exploratory](qa-exploratory.md) | any · any · service | Charter-based exploratory testing |
| | [regression-suite](regression-suite.md) | any · any · service | Keep fixed defects fixed |
| | [incident](incident.md) | extract · any · service | Respond, find the cause, write the postmortem |
| Services | [investigation](investigation.md) | any · any · service | Answer a read-only question with evidence |
| | [bug-fix](bug-fix.md) | any · any · service | Fix at the root cause, with proof |
| | [refactor](refactor.md) | any · any · service | Change structure, not behavior |
| | [pause-and-resume](pause-and-resume.md) | any · any · service | Hand off long work between sessions |
| | [demo-handoff](demo-handoff.md) | explore · throwaway · work | Package a PoC without implying it is production-ready |
