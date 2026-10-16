---
# Values of robot-grasp-flow's bindings for this repository. Lives at .flow/robot-grasp-flow/project.md.
# One line per name in the skill's bindings.md: a string, or a list [a, b].
build: colcon build --symlink-install
test: colcon test && colcon test-result --verbose
code: [src/**, test/**, launch/**, config/perception/**, docs/**]
scratch: scratch
bags: bags
dataset: data/grasp_dataset
datasheets: docs/datasheets
decisions: docs/decisions
check-split: python3 tools/check_split.py
sim-scenarios: ./tools/run_sim_scenarios.sh
sim-report: sim_report.json
sim-world: worlds/table_clutter.world
min-success: 90%
min-clearance: 2 cm
heldout-eval: tools/eval_detector.py --split heldout
bringup: grasp_bringup
real-launch: real.launch.py
safety-limits: config/safety_limits.yaml
trials: trials
tag: v<version>
remote: origin
---

# Project notes

Facts about this repository the workflow relies on. They stay here, not in the skill, so the skill stays reusable.

## Toolchain

| Purpose | Command or tool |
|---|---|
| Build | `colcon build --symlink-install` |
| Test | `colcon test && colcon test-result --verbose` |
| Simulation | `ros2 launch grasp_bringup sim.launch.py` |
| Real arm | `ros2 launch grasp_bringup real.launch.py` |
| VCS host / review | GitHub pull requests |

## Where things live

- Recorded bags: `bags/`. Spike work: `scratch/<topic>/`.
- Detector dataset: `data/grasp_dataset/`, split by recording session; datasheets in `docs/datasheets/<version>.md`; split check `python3 tools/check_split.py data/grasp_dataset --by session`.
- Held-out evaluation: `python3 tools/eval_detector.py --split heldout`, run once per hardware trial.
- Simulation: Gazebo world `worlds/table_clutter.world`; scenarios run by `./tools/run_sim_scenarios.sh`, which writes `sim_report.json`. Pass bar: grasp success at least 90% over 50 trials and clearance at least 2 cm.
- Launch files: package `grasp_bringup` (`sim.launch.py`, `real.launch.py speed:=<fraction>`).
- Safety limits: `config/safety_limits.yaml`, edited only by the operator, by hand; no playbook may write it.
- Hardware trial records: `trials/<date>/`. Decision records: `docs/decisions/<date>-<topic>.md`.
- Releases: tags `v<version>` pushed to `origin`. Arm bookings: the lab calendar, one day ahead.
