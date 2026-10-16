---
build: command that builds the workspace and exits non-zero on failure
test: command that runs the unit and bag-replay tests and exits non-zero on any failure
code: globs of the packages, tests, launch files, perception config and docs that increment may edit; never the safety limits
scratch: directory that holds throwaway spike work, one subdirectory per topic
bags: directory of recorded bags
dataset: directory of the versioned detector dataset with its train, validation and held-out splits
datasheets: directory of dataset datasheets, one file per dataset version
decisions: directory of decision records
check-split: command that takes the dataset directory and `--by session` and fails if a recording session spans two splits
sim-scenarios: script that runs Gazebo scenarios, taking `--scenario <name>` or `--all --report <file>`
sim-report: file the scenario script writes its results to
sim-world: Gazebo world used for cheap experiments
min-success: minimum grasp success rate per nominal and edge scenario in simulation
min-clearance: minimum clearance per nominal and edge scenario in simulation
heldout-eval: detector evaluation script with its held-out split argument, as it appears on the command line
bringup: ROS 2 package that holds the bringup launch files
real-launch: launch file that brings the stack up on the real arm and takes a speed:=<fraction> argument
safety-limits: file with the arm's speed and force limits, changed only by the operator by hand
trials: directory that keeps one subdirectory of bag, log, video and metrics per hardware trial
tag: release tag name, with <version> standing for the version
remote: git remote that release tags are pushed to
---

# Bindings

Every value that changes from one repository to the next is a binding: commands, paths and globs, launch files, scenario scripts, pass thresholds of one arm, the safety limits file, tag names. Playbooks, the router and the principles write `${name}`; each project gives the value in `.flow/robot-grasp-flow/project.md`. The skill itself names no repository, so it can be copied into any ROS 2 perception-to-grasp project with a simulator and a real arm.

A value is a string, or a list `[a, b]` (several globs or commands). The runtime fills the values in when it runs checks, guards commands and limits edits, and `flow status` shows them for the active playbook.
