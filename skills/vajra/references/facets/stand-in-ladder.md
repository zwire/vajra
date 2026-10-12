# Facet: stand-in-ladder

The real target is slow, expensive or dangerous, and cheaper stand-ins exist: simulators, emulators, recorded data replay, dev boards, staging, shadow traffic, canary cohorts.

## Present when

- A full test against the real target costs hours, money, risk or someone else's time.
- There is (or could be) something cheaper that predicts the real behavior well enough.

## Pin down in the domain model

- The ladder, cheapest first, with the real target last (for example: unit tests → recorded logs → simulator → test rig → supervised real run → production).
- For each rung: how to run it (command), what it can and cannot reveal, and its pass criteria.
- Known gaps between stand-in and reality, and how they are checked.

## Evidence

- "Done when" names the rung reached and its result. Evidence from a lower rung never stands in for a higher one.
- Higher rungs compare their results with the rung below and explain differences.

## Graph changes

- One validation playbook per rung that needs its own scenarios; the rung into the real target is a gate (`promotes: tracer->hardened`).
- Exploration runs on the cheapest rung that can answer the question.
- Failures on a high rung go back down to reproduce on a cheaper rung before fixing.

## Rails

- `checks`: the rung's scenario command.
- `irreversible`: commands that run on the real target, allowed only in the gate after its human gate.

## Questions

- What is the cheapest thing that predicts the real behavior?
- What has the stand-in got wrong before?
- Which rung needs a person present or a booking?
