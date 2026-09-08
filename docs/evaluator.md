# Evaluator API and rule semantics

[Back to the README](../README.md)

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
