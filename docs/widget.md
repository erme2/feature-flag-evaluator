# Install and embed the widget

[Back to the README](../README.md)

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

[`demo/widget.css`](../demo/widget.css) demonstrates a full theme and container
responsiveness; [`demo/style.css`](../demo/style.css) styles the demo shell. Neither
is shipped in the library. Hosts own layout, focus styling, responsive behavior,
and visual integration. Existing consumers of the earlier POC must remove
`import "feature-flag-evaluator/style.css"` and supply their own CSS.

The component uses modern browser APIs, including `structuredClone` and
`crypto.randomUUID`. Rule creation needs a secure context such as HTTPS or local
development on localhost. React Native is not supported. React 19 is allowed
by the peer range. The package smoke test checks installation, declarations,
production bundling, rendering, and committed editing in separate React 18 and
19 hosts. This is narrower than a full suite against every host framework.
