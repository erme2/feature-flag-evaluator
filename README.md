# Feature Flag Evaluator

An unstyled React + TypeScript widget for editing feature flag rules and seeing
which variant a user would receive. Includes a pure evaluator and a separate
styled demo. Everything runs locally in the browser; no backend is required.

A **feature flag** lets an application choose behavior through configuration.
For example, a checkout flag can return one variant for UK pro customers and a
fallback for everyone else. [Learn the concepts](docs/feature-flags.md).

## Run the demo

Requires Node.js 22+ and npm:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. Change the context
or edit a rule to see the result and matched rule update. The demo has four seed
flags and saves committed flag edits locally. [Guided walkthrough](docs/demo.md).

## Use the widget

Package name: `@erme2/feature-flag-evaluator`. No npm version is confirmed
published yet. For local installation, run `npm pack` here, then install the
resulting archive in your React application:

```sh
npm install /path/to/erme2-feature-flag-evaluator-0.1.0.tgz
```

The library supports React/React DOM 18–19, exports ESM and TypeScript
declarations, and includes **no CSS**. Hosts supply styling; only the demo has a
built-in theme. [Installation, example, and component API](docs/widget.md).

## Built, deferred, and next

Built: inline condition/variant editing with Save/Cancel, ordered rules, flag
toggles, context evaluation, matched-rule feedback, reset, and optional local
persistence. Rules use exact string equality and AND; the first match wins.

Deferred: richer operators and value types, OR groups, rollouts, a backend,
environments, undo/redo, and context/draft persistence. The next steps are review,
intended-host integration and accessibility/cross-browser verification, then
completion of npm publishing setup. [Exercise coverage and roadmap](docs/scope.md).

Arduino and Claude developed the original design; Arduino and Codex reviewed
and implemented the POC. The exercise requested a 1–2 hour stop; this
collaboration deliberately used a flexible timebox, and total effort was not
reliably measured. [Design and development context](docs/development.md).

## GitHub Actions

| Workflow                                        | Trigger                                                            | Purpose                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [CI](.github/workflows/ci.yml)                  | Push to `main`, pull request, manual run, or release workflow call | Validate code, demo, and packed React 18/19 installation; provide a downloadable npm archive    |
| [Publish to npm](.github/workflows/publish.yml) | Published non-prerelease GitHub Release                            | Rerun CI, verify the version tag, and publish the tested archive through npm trusted publishing |

Ordinary pushes and pull requests do not publish to npm. Initial npm account
setup and first publication remain pending. [Workflow details and release guide](docs/releasing.md).

## Documentation

| Guide                                  | Contents                                                       |
| -------------------------------------- | -------------------------------------------------------------- |
| [Feature flags](docs/feature-flags.md) | Flags, variants, rules, context, and defaults                  |
| [Demo](docs/demo.md)                   | Setup, seed flags, walkthrough, persistence, and reset         |
| [Widget](docs/widget.md)               | Installation, React example, props, styling, and compatibility |
| [Evaluator](docs/evaluator.md)         | Pure API, validation, and evaluation semantics                 |
| [Architecture](docs/architecture.md)   | Model, state ownership, persistence, and package boundaries    |
| [Development](docs/development.md)     | Code map, checks, test coverage, and project background        |
| [Scope and roadmap](docs/scope.md)     | Exercise requirements, tradeoffs, and possible extensions      |
| [CI and releases](docs/releasing.md)   | Both workflows, artifacts, npm setup, and release procedure    |

Licensed under [MIT](LICENSE). The private diary and original exercise materials
are excluded from the repository.

testing release action
