# Feature Flag Evaluator

A proof of concept for editing feature flag rules and seeing which variant a
user would receive. It contains a reusable React widget, a pure evaluation
function, and a separate demo application. Everything in the demo runs locally
in your browser; there is no backend or connection to a live product.

## What is a feature flag?

A feature flag is configuration that lets an application choose behavior without
changing its code for each decision. A simple flag turns a feature on or off.
A more detailed flag uses rules to choose a **variant** for a particular user.
The application must already contain the behavior associated with each variant.

For example, a checkout flag could return:

- `variant_a` for users whose country is `UK` and plan is `pro`.
- `variant_b` for other users whose country is `UK`.
- `control` for everyone else.

The **user context** supplies attributes such as country and plan. The evaluator
checks the flag's rules in order and returns the first matching variant. A final
**default rule** supplies a fallback when none of the targeted rules match.
In this implementation, disabling a flag returns no variant, so the consuming
application must decide its fallback behavior.

Feature flags can support staged releases, internal previews, experiments, and
operational switches. This POC demonstrates rule editing and evaluation; it does
not implement percentage rollouts, experiment assignment, or analytics.

## What we built

- A typed React widget with flag toggles and inline rule editing.
- Add/remove conditions, add/delete rules, button-based rule reordering, variant
  editing, and an optional final default rule.
- Save/Cancel drafts, an optional enhancement that keeps incomplete rule edits
  out of evaluation. The exercise requires inline editing, not these buttons.
- A live user-context editor, evaluation results, and matched-rule highlighting.
- Optional local persistence with runtime validation, storage error notices,
  and a confirmed reset to initial flags.
- Independent widget instances and an unstyled library with class hooks for
  host styling. The demo supplies its own CSS and responsive container layout.
- An ESM library build, TypeScript declarations, and a separate styled Vite demo
  with four seed flags. The package contains no CSS.
- Evaluator, component, and Chrome browser tests.

The host supplies the flags. The widget edits their enabled state and rules;
it does not currently create/delete flags or edit flag keys and descriptions.

### How the code is organized

| File                                                                                   | Responsibility                                                        |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`src/model.ts`](src/model.ts)                                                         | Data types, pure `evaluate` function, and `isFlags` runtime validator |
| [`src/widget.tsx`](src/widget.tsx)                                                     | React state, editors, evaluation display, and optional persistence    |
| [`demo/widget.css`](demo/widget.css)                                                   | Demo-only widget styles scoped to `.ffe`                              |
| [`src/index.ts`](src/index.ts)                                                         | Public component, functions, and type exports                         |
| [`demo/main.tsx`](demo/main.tsx)                                                       | Demo shell, seed flags, and initial user context                      |
| [`src/model.test.ts`](src/model.test.ts), [`src/widget.test.tsx`](src/widget.test.tsx) | Evaluator, validation, and component tests                            |
| [`e2e/widget.spec.ts`](e2e/widget.spec.ts)                                             | Browser workflows and narrow-container checks                         |

The model is separate from the UI so evaluation can be used without rendering
the editor. The widget uses local React state; the reducer/context layer in the
original proposal was not needed for this first implementation.

## Run and use the demo

Requires Node.js 22+ and npm. From this project's directory:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. No account,
API key, or environment file is required.

### Guided walkthrough

The initial context is `country = UK`, `plan = pro`. With the original seed data:

| Flag                 | Initial result | Why                                                   |
| -------------------- | -------------- | ----------------------------------------------------- |
| `new_checkout`       | `variant_a`    | The first rule matches both country and plan          |
| `search_preview`     | `standard`     | No `team` attribute matches; the default wins         |
| `maintenance_banner` | Disabled       | The flag is switched off                              |
| `priority_support`   | No match       | The plan is not `enterprise`, and there is no default |

1. In **User context**, change `plan` to `basic`. Checkout becomes `variant_b`.
   Change `country` to `FR` and it becomes `control`.
2. Restore `country = UK` and `plan = pro`. Move the second checkout rule above
   the first with its up-arrow button. The result becomes `variant_b`: ordering
   matters because the broader UK rule now matches first.
3. Click a rule's pencil button, edit **Returned variant**, and select
   **Save rule**. The result updates after saving. **Cancel** discards the draft.
4. Try **Add rule**, **Add condition**, the trash buttons, and **Add default**
   on a flag without a default. A match rule must keep at least one condition;
   attribute names and variants cannot be blank.
5. Add context `team = internal` to get `preview` for search. Set
   `plan = enterprise` to get `priority` for support. Enable the maintenance
   banner to get `visible` from its default rule.
6. Refresh the page. Committed flag edits survive, while context returns to its
   initial values. Select **Reset**, then **Reset flags** to restore seed flags;
   reset leaves the currently edited context unchanged.

The demo stores committed flags under local-storage key `ffe:demo:v1`. If you
have used it before, reset the flags and restore the initial context before
following the walkthrough. Storage belongs to the browser origin, so another
host or port has separate data. Invalid or unreadable saved data falls back to
initial flags with a notice; failed writes leave edits in memory with a warning.

To generate the static demo, run `npm run build:demo`; its output is
`demo-dist/`. The library build described below has a separate `dist/` output.

## Install the widget in another application

The package name is `@erme2/feature-flag-evaluator`. Publication is being prepared;
no npm version is confirmed live yet. Once published, install it with
`npm install @erme2/feature-flag-evaluator`.

For local use now, build and package it, then install the archive in your host:

```sh
# In the feature-flag-evaluator directory:
npm ci
npm pack

# In your host application (replace both paths):
cd /path/to/your-react-app
npm install /path/to/feature-flag-evaluator/erme2-feature-flag-evaluator-0.1.0.tgz
```

The host must supply React and React DOM: the declared peer range is
`>=18 <20`, and this POC was developed and tested with React 18.3.1. The library
is ESM-only. Its archive contains the built library and declarations, with no
CSS import or stylesheet export. The styled demo is separate.
`npm pack` runs the library/type declaration build through `prepack`. Repack
and reinstall when distributing a changed version locally.

### Render the widget

```tsx
import { FeatureFlagEvaluator, type Flag } from "@erme2/feature-flag-evaluator";

const flags: Flag[] = [
  {
    key: "new_checkout",
    description: "Preview checkout for UK pro customers",
    enabled: true,
    rules: [
      {
        id: "checkout-pro",
        kind: "match",
        conditions: [
          { attribute: "country", op: "eq", value: "UK" },
          { attribute: "plan", op: "eq", value: "pro" },
        ],
        variant: "variant_a",
      },
      { id: "checkout-default", kind: "default", variant: "control" },
    ],
  },
];

export function FlagPanel() {
  return (
    <FeatureFlagEvaluator
      initialFlags={flags}
      initialContext={{ country: "UK", plan: "pro" }}
      onChange={(nextFlags) => console.log("Committed flags:", nextFlags)}
      persistenceKey="my-app:flags:v1"
    />
  );
}
```

### Component API and state ownership

| Prop                                | Required | Behavior                                                |
| ----------------------------------- | -------- | ------------------------------------------------------- |
| `initialFlags: Flag[]`              | Yes      | Initial dataset; invalid data throws an error           |
| `initialContext: UserContext`       | No       | Initial string attributes; defaults to `{}`             |
| `onChange: (flags: Flag[]) => void` | No       | Receives a cloned snapshot after committed flag changes |
| `persistenceKey: string`            | No       | A nonempty key enables browser local storage            |
| `className: string`                 | No       | Adds a class to the widget's root element               |

This is an **uncontrolled widget**: initial props seed local state. Updating
those props does not replace active edits. Remount with a different React `key`
to load another dataset, and use a different persistence key if it needs separate
saved data. Keep the persistence key stable for a mounted instance.

Valid stored flags take precedence over initial flags. Reset restores the
current `initialFlags` prop. `onChange` fires after saving rules, toggling flags,
reordering, deleting rules, or resetting; it does not fire for initialization,
unsaved drafts, or context edits. The widget does not expose context-change or
evaluation-result callbacks.

Omit `persistenceKey` to avoid browser storage and let the host save `onChange`
snapshots itself. Remote persistence, loading states, and error handling would
be the host's responsibility. Use distinct storage keys for independent widgets;
there is no synchronization between tabs or instances sharing a key.

This is a browser widget. In a server-rendered host, mount it client-side when
using persistence to avoid differing server and client storage state.

### Styling in the host

The library supplies markup, class names, and behavior, with no bundled or
injected CSS. It retains its SVG icons; it is an unstyled component, not a
headless rendering API. Without host styles, it uses browser defaults.

Style the `.ffe` root and its descendant class hooks in your application, or
pass `className` to scope your own theme. For example:

```css
.my-flags .ffe-layout {
  display: grid;
  gap: 1rem;
}

.my-flags .ffe-matched {
  border-inline-start: 3px solid currentColor;
}
```

Use `<FeatureFlagEvaluator initialFlags={flags} className="my-flags" />` with
those host-owned styles. The matched rule also has a visible **Matched** label,
so the result does not depend on a highlight color.

[`demo/widget.css`](demo/widget.css) demonstrates a full theme and container
responsiveness; [`demo/style.css`](demo/style.css) styles the demo shell. Neither
is shipped in the library. Hosts own layout, focus styling, responsive behavior,
and visual integration. Existing consumers of the earlier POC must remove
`import "feature-flag-evaluator/style.css"` and supply their own CSS.

The component uses modern browser APIs, including `structuredClone` and
`crypto.randomUUID`. Rule creation needs a secure context such as HTTPS or local
development on localhost. React Native is not supported. React 19 is allowed
by the peer range. The package smoke test checks installation, declarations,
production bundling, rendering, and committed editing in separate React 18 and
19 hosts. This is narrower than a full suite against every host framework.

## Use the evaluator without the editor

The package exports `evaluate`, `isFlags`, and the types `Flag`, `Rule`,
`Condition`, `UserContext`, and `EvalResult`, alongside the component and its
`FeatureFlagEvaluatorProps` type. No stylesheet import is needed for evaluation.

```ts
import { evaluate, isFlags } from "@erme2/feature-flag-evaluator";

// JSON received from your own configuration source:
const configuration: unknown = [
  {
    key: "maintenance_banner",
    enabled: true,
    rules: [{ id: "fallback", kind: "default", variant: "visible" }],
  },
];

if (!isFlags(configuration)) {
  throw new Error("Invalid flag configuration");
}

const banner = configuration.find((flag) => flag.key === "maintenance_banner");
if (!banner) throw new Error("Missing maintenance_banner flag");

const result = evaluate(banner, { country: "UK" });
// { variant: 'visible', reason: 'default', matchedRuleId: 'fallback' }
const showBanner = result.variant === "visible";
// Use showBanner in your application's own rendering logic.
```

`evaluate` expects a valid `Flag`; it does not validate external input itself.
Use `isFlags` at the boundary when loading untrusted JSON. Flag keys must be
unique, and rule IDs must be unique within each flag.

### Evaluation semantics

- Conditions support string equality (`op: 'eq'`) only. Comparisons are exact
  and case-sensitive; there is no numeric conversion or automatic trimming.
- Every condition in a match rule must pass (**AND**). A missing attribute never
  matches, and inherited object properties do not count as context attributes.
- Rules run top to bottom; the first match wins. A default is optional, unique,
  and last. Match rules must have at least one condition.
- Empty string condition values are valid. Blank attribute names, rule IDs,
  flag keys, and variants are invalid.
- Blank or duplicate context attribute names in the widget pause evaluation
  until corrected. Context values are strings and are not persisted.

| `reason`     | `variant`               | `matchedRuleId`  |
| ------------ | ----------------------- | ---------------- |
| `rule_match` | Matching rule's variant | Matching rule ID |
| `default`    | Default rule's variant  | Default rule ID  |
| `disabled`   | `null`                  | Absent           |
| `no_match`   | `null`                  | Absent           |

## Possible implementations and extensions

Current equality-only string rules and AND semantics are accepted for this
version. Richer rules are optional future implementations, not missing exercise
requirements. Save/Cancel is already implemented; auto-commit editing or a
configurable commit mode could be explored later, but is not required.

These are possible directions, not completed integrations:

| Direction                     | How this POC could fit                                                                | Additional work needed                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Embedded configuration panel  | Mount the widget in an internal React application                                     | Host authentication, permissions, remote loading/saving, and conflict handling                   |
| Application feature selection | Call `evaluate` with configuration and user context, then render the chosen behavior  | Configuration delivery, explicit fallbacks, and a strategy for consistent decisions              |
| Shared flag service           | Use the editor as an administration UI and evaluate trusted configuration on a server | API, database, environments, versioning, audit history, caching, and compatible server packaging |
| Rollouts and experiments      | Extend rules to target cohorts or assign variants                                     | Stable user bucketing, percentages, exposure events, and outcome measurement                     |
| Richer targeting              | Extend the model, evaluator, editor, and validator together                           | Additional operators, typed values, OR groups, and migration of saved data                       |

Browser configuration is editable by the user and must not serve as the
application's authorization boundary. Any server-side capability still needs
server-side permission checks.

## Exercise requirements and remaining work

Assessment against the supplied exercise brief (kept locally as
`../staff-frontend-challenge.docx`; the original brief and private correspondence
are excluded from Git):

| Exercise requirement                                               | Current implementation                                                                                    |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| View all flags and their rules                                     | All supplied flags render with their ordered rules                                                        |
| Edit rules inline, add/remove conditions, reorder, change variants | Inline form with Save/Cancel, condition controls, up/down buttons, and variant input                      |
| Evaluate against arbitrary context entered in a side panel         | Editable attribute/value rows; any attribute name, with string values                                     |
| Show the result and which rule matched                             | Per-flag result, summary, and a visible Matched label; demo adds highlighting                             |
| Persist changes locally across refresh                             | Demo persists committed flag changes; context and unsaved drafts are not persisted                        |
| Seed 3–5 flags of varying complexity                               | Four flags with AND targeting, defaults, a disabled flag, and a no-default case                           |
| JavaScript/TypeScript or Flutter                                   | React with TypeScript                                                                                     |
| README: run instructions, built/cut scope, next steps              | Covered in this document                                                                                  |
| Deliver code through a repo or zip                                 | Git is initialized and CI/publish workflows are prepared; first commit, push, and publication are pending |

No explicitly listed UI feature is currently missing. The brief leaves value
types and draft/context persistence unspecified; the choices above are scope
limits, not claims of supporting every possible interpretation. Flag creation,
extra operators, Save/Cancel specifically, a backend, and package publication
are not explicit requirements.

The brief also asks for a 1–2 hour stop and discussion of tools used. This
collaboration deliberately used a flexible timebox; reliable elapsed effort is
unknown. That deviation must remain visible in the handoff. React, TypeScript,
Vite, Lucide icons, Vitest/Testing Library, Playwright, and Prettier support the
implementation and checks; Claude and Codex's roles are recorded below and in
the local diary.

## Next steps

1. Review the requirements assessment above and validate the exercise workflow.
   Address any demonstrated requirement gap before adding optional capabilities.
2. Keep README, ASD, plan, and agent context aligned with accepted implementation
   changes; retain dated history in the local diary and disclose the timebox deviation.
3. Improve confidence through intended-host integration, broader cross-browser
   checks, keyboard/screen-reader review, and a dedicated linter. These are
   verification improvements, not additional feature requirements from the brief.
4. Consider optional implementations only after the exercise scope is settled:
   richer targeting, alternative editing interactions, undo/redo, schema
   migration, import/export, context/draft persistence, synchronization, or
   environments. Drag-and-drop and a legacy importer also remain deferred.
5. **Distribution:** review the prepared changes, resolve local Git authentication,
   then commit/push when authorized and complete npm authentication and trusted publisher setup in
   [`RELEASING.md`](RELEASING.md). The public GitHub repository exists and MIT is selected. Work is paused for
   review before the first commit or pushing; no registry publication is claimed yet.

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

## Project history and design references

Arduino and Claude developed the original [`asd.md`](asd.md). Arduino then asked
Codex to challenge it and implement an extensible POC as an exported widget.
[`project documentation`](project documentation) records the working scope; [`../private development history`](../private development history) records
choices, problems, and verification. The ASD was reconciled with the current
implementation on 2026-09-08; earlier proposals remain described in the local diary.

The exercise brief requests a 1–2 hour stop. Arduino requested a flexible timebox
in favor of completeness for this collaboration. Total elapsed effort was not
reliably measured and must be reconciled before submission.

Demo-only visual cues were adapted from Experian's public score site: a
Roboto/Helvetica/Arial font stack, blue actions, and a magenta accent. No logo,
brand assets or remote font downloads are included. The library bundles no CSS.

## CI and releases

[`ci.yml`](.github/workflows/ci.yml) validates pushes to `main` and pull requests,
and supports manual runs. It runs formatting, unit/component tests, demo build,
package installation checks, dependency audit, and desktop/mobile browser tests.
Successful runs provide an `npm-package` artifact containing the tested archive.

[`publish.yml`](.github/workflows/publish.yml) runs the same validation for a
published, non-prerelease GitHub Release. Its tag must equal `v` plus the package
version. The publish job uses npm OIDC authentication and publishes the exact
archive validated by CI. PRs, ordinary pushes, and draft/prerelease releases do
not publish to npm. Account setup and the first publication are described in
[`RELEASING.md`](RELEASING.md). These workflows have not run on GitHub yet.

Licensed under the [MIT License](LICENSE). The private diary and source exercise
materials are intentionally excluded from the repository pending review.
