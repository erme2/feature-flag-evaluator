# Demo walkthrough

[Back to the README](../README.md)

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
