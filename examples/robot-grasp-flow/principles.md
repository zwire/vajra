# Principles

Apply these throughout. When a principle changes a decision, name it in your reply.

## Simulation before metal

Every behavior runs in Gazebo or against recorded bags before it touches the real arm. Applies to spike, increment and sim-validation.

## Prove it works

Show evidence from the real artifact (metrics, logs, video, test output), not a claim. Applies to every "Done when".

## Throwaway means throwaway

Spike code lives in `${scratch}/`, is never imported by the stack, and is deleted after `decide`. Applies to spike and decide.

## Rebuild, don't promote

After a go decision, write the node fresh in the real package structure using what the spike taught. Applies to decide and increment.

## Safe state on every failure

Every node that can command motion stops the arm on timeout, sensor dropout or exception. Applies to increment and hardware-trial.

## Gate the irreversible

Stop for the operator before anything moves the real arm or changes `${safety-limits}`. Applies wherever a step is tagged `[irreversible]`.
