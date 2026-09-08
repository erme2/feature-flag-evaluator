# Feature Flag Evaluator agent context

## Read before working

- Follow the parent Yaup instructions and workflow. Read the parent `README.md`,
  `config/yaup.yaml`, and `.agents/README.md` as required there.
- Read this project's `README.md` for current behavior, public API, installation,
  and validation commands; `project documentation` for working scope; and relevant entries in
  `../private development history` for decisions and verification history.
- Read `asd.md` for the current design and exercise requirements assessment.
  Keep it aligned with implementation; historical decisions remain in `../private development history`.

## Working agreement

- This is an extensible POC: a reusable React widget, pure evaluator, and separate
  demo. Keep work in this visible `repos/feature-flag-evaluator` directory.
- Git was initialized on `main` on 2026-09-08 after Arduino authorized a first
  commit and npm build/publish automation. Package name:
  `@erme2/feature-flag-evaluator`; intended public GitHub repository:
  `erme2/feature-flag-evaluator`, now created publicly. MIT is selected. Yaup
  registration is still pending. Arduino requested undoing the local commit;
  main now has no commits. Stop with reviewable, uncommitted changes before
  any commit or push.
- Future commits, pushes, repository/account changes, and releases follow the
  user's authorization and parent workflow. A request to edit code alone is
  not authorization to publish a package. See `RELEASING.md` for release setup.
- Treat existing changes as user-owned. Keep changes within the requested scope
  and distinguish proposed capabilities from completed work.

## Implementation conventions

- Keep evaluation and runtime validation in `src/model.ts`, widget behavior in
  `src/widget.tsx`, public exports in `src/index.ts`, and demo setup in `demo/`.
- Preserve the documented semantics unless a requested change revises them:
  exact string equality, AND conditions, first-match ordering, an optional final
  default, and explicit disabled/no-match results.
- Preserve Save/Cancel draft isolation, uncontrolled initialization, committed
  flag callbacks, and opt-in caller-keyed persistence. Validate external flag
  data at loading boundaries. Context edits are live and are not persisted.
- The library is unstyled: do not import, bundle, or export CSS from `src/`.
  Keep the demonstration styling in `demo/widget.css` and `demo/style.css`.
  Preserve class hooks and semantic markup for host styling. Keep demo styles
  scoped appropriately, verify narrow demo containers, and keep React as a peer
  dependency of the ESM library.
- When extending the model, update the evaluator, validator, editor, tests, and
  documentation together wherever affected. Current rule semantics are accepted;
  richer targeting and alternative editing behavior belong to possible future
  implementations. Save/Cancel is an existing optional enhancement, not an
  explicit exercise requirement. Save/Cancel is explicitly retained. The build
  and publishing workflows now cover distribution; do not claim a release is
  live until GitHub/npm confirm it.

## Verification and handoff

- Use the validation commands and prerequisites in `README.md`. For code changes,
  run relevant tests and the applicable type, formatting, and build checks;
  verify browser workflows when UI behavior or layout changes. Run
  `npm run test:package` for packaging/public API changes; it installs the actual
  archive in temporary React 18 and 19 hosts. Follow any
  configured mandatory Yaup validation requirements as well.
- For documentation-only work, check accuracy against source and check Markdown
  formatting. Do not add tests that merely mirror documentation edits.
- Report checks actually run, failures, and checks unavailable or omitted. Do
  not present historical validation as a result of the current session.
- Record meaningful decisions, changes, verification, and open questions in
  `../private development history`; maintain `project documentation` when scope changes. Keep private correspondence,
  secrets, and invented elapsed-time estimates out of these records.
