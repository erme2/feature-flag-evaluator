# Development and validation

[Back to the README](../README.md)

## Code organization

| File                                                                                         | Responsibility                                                        |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`src/model.ts`](../src/model.ts)                                                            | Data types, pure `evaluate` function, and `isFlags` runtime validator |
| [`src/widget.tsx`](../src/widget.tsx)                                                        | React state, editors, evaluation display, and optional persistence    |
| [`demo/widget.css`](../demo/widget.css)                                                      | Demo-only widget styles scoped to `.ffe`                              |
| [`src/index.ts`](../src/index.ts)                                                            | Public component, functions, and type exports                         |
| [`demo/main.tsx`](../demo/main.tsx)                                                          | Demo shell, seed flags, and initial user context                      |
| [`src/model.test.ts`](../src/model.test.ts), [`src/widget.test.tsx`](../src/widget.test.tsx) | Evaluator, validation, and component tests                            |
| [`e2e/widget.spec.ts`](../e2e/widget.spec.ts)                                                | Browser workflows and narrow-container checks                         |

The model is separate from the UI so evaluation can be used without rendering
the editor. The widget uses local React state; the reducer/context layer in the
original proposal was not needed for this first implementation.

## Validation

From the project directory:

```sh
npm test
npm run typecheck
npm run build
npm run build:demo
npm run format:check
npm audit
```

Run browser and package tests with Google Chrome installed locally:

```sh
npm run test:browser
npm run test:package
```

Playwright starts the demo on port 5173 automatically, or reuses a running local
server outside CI. CI starts its own server. Screenshots go to `test-results/`.
The package test builds and packs the library, installs it into temporary React
18 and 19 hosts, checks declarations and production bundling, and exercises an
unstyled widget in Chrome. It needs registry access for consumer dependencies
and leaves the tested `.tgz` in `artifacts/`. Temporary hosts are removed.

Component tests cover draft isolation, callbacks, storage failure/recovery,
and independent instances. Evaluator tests cover precedence, defaults, missing
attributes, disabled flags, and malformed stored data. Browser tests cover the
editing workflow, refresh persistence, reset, mobile layout, and narrow embedding.
Vitest workers disable Node's experimental web storage so jsdom owns test storage.

The formatting command checks source, scripts, workflows, and Markdown. There is no
dedicated linter or formal accessibility audit configured. TypeScript and
formatting checks do not replace those checks. The project has no Yaup validation
registration or configured exemptions yet. See the local diary for checks actually
run and their results.

## Project history

Arduino and Claude developed the original [architecture design](architecture.md). Arduino then asked
Codex to challenge it and implement an extensible POC as an exported widget.
The ASD records the working design; private development history is retained
outside this repository. The ASD was reconciled with the current implementation
on 2026-09-08; earlier proposals remain outside the repository.

The exercise brief requests a 1–2 hour stop. Arduino requested a flexible timebox
in favor of completeness for this collaboration. Total elapsed effort was not
reliably measured and must be reconciled before submission.

Demo-only visual cues were adapted from Experian's public score site: a
Roboto/Helvetica/Arial font stack, blue actions, and a magenta accent. No logo,
brand assets or remote font downloads are included. The library bundles no CSS.
