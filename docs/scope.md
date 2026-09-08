# Exercise coverage and roadmap

[Back to the README](../README.md)

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

## Exercise requirements and remaining work

Assessment against the supplied exercise brief. The original brief and private
correspondence are retained outside this repository:

| Exercise requirement                                               | Current implementation                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| View all flags and their rules                                     | All supplied flags render with their ordered rules                                           |
| Edit rules inline, add/remove conditions, reorder, change variants | Inline form with Save/Cancel, condition controls, up/down buttons, and variant input         |
| Evaluate against arbitrary context entered in a side panel         | Editable attribute/value rows; any attribute name, with string values                        |
| Show the result and which rule matched                             | Per-flag result, summary, and a visible Matched label; demo adds highlighting                |
| Persist changes locally across refresh                             | Demo persists committed flag changes; context and unsaved drafts are not persisted           |
| Seed 3–5 flags of varying complexity                               | Four flags with AND targeting, defaults, a disabled flag, and a no-default case              |
| JavaScript/TypeScript or Flutter                                   | React with TypeScript                                                                        |
| README: run instructions, built/cut scope, next steps              | Summarized in the README; details in these guides                                            |
| Deliver code through a repo or zip                                 | First local commit exists; CI/publish workflows are prepared and publication remains pending |

No explicitly listed UI feature is currently missing. The brief leaves value
types and draft/context persistence unspecified; the choices above are scope
limits, not claims of supporting every possible interpretation. Flag creation,
extra operators, Save/Cancel specifically, a backend, and package publication
are not explicit requirements.

The brief also asks for a 1–2 hour stop and discussion of tools used. This
collaboration deliberately used a flexible timebox; reliable elapsed effort is
unknown. That deviation must remain visible in the handoff. React, TypeScript,
Vite, Lucide icons, Vitest/Testing Library, Playwright, and Prettier support the
implementation and checks; Claude and Codex's roles are described in the [development guide](development.md).
The private diary is retained outside this repository.

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
   [release guide](releasing.md). The public GitHub repository exists and MIT is selected. Work is paused for
   review before further commits or pushing; no registry publication is claimed yet.
