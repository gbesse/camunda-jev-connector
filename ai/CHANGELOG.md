# AI change log

This file records the purpose and technical decisions of agent-authored changes.

## 2026-09-21 — v0.1.0

- Implemented `camunda-jev-connector` as a native host integration with a runnable example and synthetic verification.
- Reused DecisionPacks directly for JavaScript, or ported its finite gates with reference cases for PHP/Python; retained MIT attribution.
- Added bounded provider calls, pinned model checks and explicit failure handling. Host authorization remains with the integrating application.
- Documented verified scope and alpha limitations. Tests and type/syntax checks only; no production build or live inference performed.
- Validation: Official Camunda REST SDK 9.1.5 and element-template schema 0.46.0: 6 tests. Syntax check, TypeScript noEmit and synthetic demo passed. No live broker.
