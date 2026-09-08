# Architecture and design

[Back to the README](../README.md)

The canonical ASD is maintained at [`../ASD.md`](../ASD.md). This guide provides
the architecture details in the documentation index.

Current design, reconciled with the implementation on 2026-09-08. Arduino and
Claude developed the original proposal; Arduino and Codex reviewed and evolved
it into this POC. Historical reasoning and verification remain in the private diary retained outside this repository.
[README](../README.md) links the usage guides; [exercise coverage](scope.md)
contains the requirements assessment.

## Scope and exercise coverage

Build an extensible feature flag editor/evaluator using React and TypeScript,
with no backend. The exercise requires flag/rule display; inline condition
editing, rule ordering, and variant changes; context input in a side panel;
evaluation results identifying the matched rule; local persistence; and 3–5
seed flags. These features are implemented in the demo with four flags.

The brief allows changing the suggested JSON shape. Current string equality
and AND semantics are accepted. Other operators, value types, and grouping are
possible future implementations. The brief requires inline editing but does not
specify Save/Cancel: that existing draft workflow is an optional enhancement.

Committed flag changes persist across refresh in the demo. Context and unsaved
drafts do not. The brief does not explicitly prescribe their persistence or
require non-string context values. These are documented scope choices.

The brief requests a 1–2 hour stop; Arduino requested a flexible timebox for this
collaboration. Actual elapsed effort is unknown. Estimates in the original
proposal were not measured results. Distribution preparation is now authorized; local Git initialization and GitHub
Actions workflows are in place, with GitHub Packages publication configured.
No additional required UI feature has been identified as missing.

## Architecture and package boundary

- `src/model.ts`: types, pure evaluation, and runtime flag validation.
- `src/widget.tsx`: exported component, local state, inline `RuleEditor`, context
  rows, result display, and optional storage. There is no reducer/context store.
- `src/index.ts`: public component, evaluator, validator, and type exports.
- `demo/main.tsx`: separate React demo with seeds and persistence enabled.
- `demo/widget.css`: demo-only widget theme, scoped under `.ffe`, including
  container-responsive layout. `demo/style.css` styles the surrounding shell.

The library has no CSS imports, CSS output, or stylesheet export. It renders
semantic HTML with `.ffe` class hooks and SVG icons; consumers supply styling.
This is an unstyled React component, not a headless or render-prop API. The demo
owns the Experian-inspired visual treatment.

Vite builds an ESM library into `dist/`; TypeScript emits declarations there.
React, React DOM, and the React JSX runtime are externalized. The package declares
React/React DOM `>=18 <20`, with React 18.3.1 tested so far, and Node.js 22+ for
package tooling. The package is named `@erme2/feature-flag-evaluator` and has public npm access
configured, but MIT is selected and publication is still pending. `npm pack`
builds through `prepack` and creates a local archive. `ci.yml` validates and
produces the archive; `publish.yml` uses OIDC to publish the tested archive on
a stable GitHub Release after checking tag/version alignment. The demo builds separately to `demo-dist/`.

## Data model

```ts
type Condition = { attribute: string; op: "eq"; value: string };
type Rule =
  | { id: string; kind: "match"; conditions: Condition[]; variant: string }
  | { id: string; kind: "default"; variant: string };
type Flag = {
  key: string;
  description?: string;
  enabled: boolean;
  rules: Rule[];
};
type UserContext = Record<string, string>;
type EvalResult = {
  variant: string | null;
  reason: "disabled" | "rule_match" | "default" | "no_match";
  matchedRuleId?: string;
};
```

Rule kinds are explicit, IDs support editing and reordering, and conditions
carry an operator field as an extension point. Only `eq` is currently valid;
unsupported operators are not predeclared as if implemented. There is no
legacy-schema importer.

`isFlags` validates unknown data at loading boundaries: unique nonblank flag
keys, unique nonblank rule IDs within each flag, booleans for enabled state,
nonblank variants, string condition values, and valid rule kinds. Match rules
need at least one condition with a nonblank attribute. At most one default is
allowed, last and without conditions. Empty string values are valid. A flag may
have no rules. TypeScript types alone do not validate incoming JSON.

## Evaluation

`evaluate(flag, context)` expects a valid flag and does not mutate it. Disabled
flags immediately return `disabled` with a null variant. Otherwise rules run
in order; the first matching rule wins. Match conditions all require exact,
case-sensitive string equality. There is no coercion or trimming. Missing and
inherited context attributes do not match. A final default returns its variant
and rule ID. With no matching rule or default, evaluation returns `no_match`
with a null variant. Hosts decide how null results affect their product.

## Editing and state ownership

The widget is uncontrolled. `initialFlags` and `initialContext` initialize local
state; later prop updates do not replace active edits. A new React `key` remounts
it for another dataset. `className` adds a host styling hook.

Inline rule forms clone a draft, validate it, and commit only through Save rule.
Cancel discards the draft. Only one rule editor is open at a time. Reordering
uses up/down buttons, with the default pinned last. The user can add/delete rules
and conditions, edit variants, toggle flags, and reset flags with confirmation.
Flag creation/deletion and key/description editing are outside the current UI.

Context rows update evaluation live. Blank or duplicate names pause evaluation
with a notice. Results appear per flag and in the context panel summary. The
matched rule has a text label and class hook; the demo CSS adds highlighting.

`onChange` receives a cloned flags snapshot after committed edits, toggles,
reordering, rule deletion, or reset. It does not fire for initialization, drafts,
or context changes. There are no context/result callbacks. Reset restores the
current `initialFlags` prop and leaves context unchanged.

## Persistence

A nonempty caller-owned `persistenceKey` enables local storage. Omission disables
storage access. The demo uses `ffe:demo:v1` and stores
`{ schemaVersion: 1, flags: [...] }`. Writes happen synchronously on committed
flag changes; there is no debounce or write effect.

Loading checks both the envelope version and the complete flags payload. Valid
saved flags override initial flags. Invalid or unreadable data falls back to
initial flags with a notice. Write failures keep changes in memory and warn the
user. Context and drafts are not saved. Schema migrations and cross-tab
synchronization are not implemented; independent widgets need distinct keys.

Hosts can omit local persistence and save snapshots themselves. Remote loading,
conflict handling, errors, and authorization then belong to the host. Mount the
widget client-side when using persistence in a server-rendered application.
Modern browser APIs are required, including `structuredClone` and secure-context
`crypto.randomUUID` for rule creation.

## Demo seeds

| Flag                 | Purpose                                 | Result for country=UK, plan=pro |
| -------------------- | --------------------------------------- | ------------------------------- |
| `new_checkout`       | AND rule, broader UK rule, then default | `variant_a`                     |
| `search_preview`     | Internal-team targeting with default    | `standard`                      |
| `maintenance_banner` | Disabled flag with default              | Disabled                        |
| `priority_support`   | Enterprise targeting with no default    | No match                        |

## Validation

The suite contains 16 evaluator/validator cases and 6 component cases. Component
coverage includes draft isolation, callbacks, persistence, invalid storage,
write failures, independent instances, and duplicate context names. Playwright
runs two workflows at desktop and mobile sizes, including a 320px container.
Checks also include TypeScript, library/declaration build, demo production
build, formatting, and dependency audit. README documents commands and browser
prerequisites; the diary records which checks actually ran per session.

A package smoke test installs the actual archive into separate React 18 and 19
hosts, checks declarations and production builds, and exercises unstyled editing
and callbacks in Chrome. Intended-host framework integration remains unverified. There is no dedicated
linter, formal accessibility audit, or configured Yaup validation registration.
Browser coverage currently uses Chrome, with automatic demo startup in
Playwright and portable screenshot paths. Demo layout checks do not guarantee
the layout of styles supplied by another host.

## Possible future implementations and delivery order

First address any demonstrated gap against the exercise and keep the current
documents aligned. No additional required UI feature is presently identified.
Existing Save/Cancel behavior can remain; alternative auto-commit editing or
configurable commit behavior is optional.

Possible extensions include more operators, typed values, OR/nested groups,
rollouts with stable bucketing, experiments and exposure tracking, environments,
a backend, import/export, a legacy importer, schema migrations, undo/redo,
context/draft persistence, cross-tab synchronization, and drag-and-drop ordering.
Each needs coordinated model, UI, validation, and test work where applicable;
none is represented as a one-line addition or an existing action-log capability.

The public GitHub repository now exists and the package is MIT licensed.
After the earlier baseline was undone, Arduino created the first local commit. The diary and source exercise files are outside this checkout and
excluded from Git. CI/release workflows are prepared locally. Arduino requested
a pause for review before further commits or push. Git SSH authentication is unavailable, and
npm is not authenticated. `releasing.md` records the procedure and current
blockers. Workflows and local dry runs are not evidence of a published version.
