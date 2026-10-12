# Facet: physical-world

Software moves, powers, heats, or can brick something physical: robots, vehicles, drones, motors, firmware on devices, lab equipment.

## Present when

- A bug can break hardware, hurt a person, or leave a device unrecoverable.
- Running the code needs physical setup, supervision or a booking.

## Pin down in the domain model

- What can be damaged or hurt, and what stops it (e-stop, limits, interlocks, recovery mode).
- The operator role during real runs, and how readiness is confirmed.
- Safe states: what the system does on timeout, sensor loss, power loss, exceptions.
- Recovery paths for devices (bootloader, A/B partitions, JTAG) and what they cost.

## Evidence

- Trial logs with the operator's name, recordings (video, telemetry), and comparison with the stand-in rung.
- Safe-state behavior shown in tests for every failure mode listed.

## Graph changes

- Safety rules win over every other facet and over `autonomy`: real-world runs always stop at a `[human-gate]`.
- Add a hardware trial gate with a safety checklist before anything moves or is flashed; usually also `stand-in-ladder`.
- `harden` and increments add watchdogs, limits and safe states as explicit steps.

## Rails

- `irreversible`: every command that moves, powers, flashes or changes safety limits of real hardware (launch files, flash tools, limit configs).
- `rails` at least `standard`; `strict` when people are nearby.

## Questions

- What is the worst physical outcome, and what stops it today?
- Who is the operator, and where is the stop button?
- How do you recover a device that stops booting?
