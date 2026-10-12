# Facet: perceptual-output

Success is judged by eyes, ears or hands: rendering, image quality, audio, game feel, UI motion, typography.

## Present when

- "Looks right", "feels right" or "sounds right" is the acceptance criterion.
- Correct output can differ pixel by pixel or sample by sample and still be acceptable.

## Pin down in the domain model

- Reference outputs (golden images, audio clips, recordings) and where they live.
- The comparison and tolerance (perceptual diff, SSIM, per-channel threshold), and which differences are acceptable.
- Who judges subjective quality, and how (side-by-side review, playtest script, A/B with users).
- Target surfaces: devices, displays, GPUs, speakers.

## Evidence

- Side-by-side captures of before and after on the target surface, plus the diff result against references.
- For feel and subjective quality: notes from a structured session with named observers, not "looks good".

## Graph changes

- `prototype`: variants are shown side by side; the user picks.
- Add a visual or perceptual regression playbook when kept output must not drift: render references, diff, review the diffs a human must accept.
- Add a playtest or review session playbook when a person's judgment is the gate.

## Rails

- `checks`: the reference comparison command with its tolerance.
- Updating references is a human decision: put it behind a `[human-gate]` step.

## Questions

- Which outputs must never change without someone noticing?
- Who decides that a change in look or feel is acceptable?
- Which devices or displays matter?
