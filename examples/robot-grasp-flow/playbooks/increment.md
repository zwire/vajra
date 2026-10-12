---
id: increment
title: Increment
phase: expand
lifecycle: tracer
kind: work
writes: [src/**, test/**, launch/**, config/perception/**, docs/**]
checks:
  - colcon build --symlink-install
  - colcon test && colcon test-result --verbose
exits:
  - to: dataset-curation
    when: the detector needs data it does not have
  - to: sim-validation
    when: the change builds and its tests pass on recorded bags
---

# Increment

## Purpose

Deliver one slice of behavior in the real ROS 2 packages.

## Steps

1. Name the topics, messages and behavior change. Write acceptance criteria as observable behavior.
2. Implement the smallest change in the real package structure.
3. Give every node that can command motion a safe state on timeout, sensor dropout and exception.
4. Write or update tests that replay recorded bags through the changed nodes.
5. Run `colcon build --symlink-install` and `colcon test && colcon test-result --verbose`.
6. Open a GitHub pull request and drive CI to green.

## Done when

- Each acceptance criterion is shown met on bags replayed by `colcon test`, every motion-commanding node has a tested safe state, and CI is green on the pull request.

## Reply with

- Criteria with evidence, test results, and the PR link.
