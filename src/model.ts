export type Condition = { attribute: string; op: "eq"; value: string };
export type Rule =
  | { id: string; kind: "match"; conditions: Condition[]; variant: string }
  | { id: string; kind: "default"; variant: string };
export type Flag = {
  key: string;
  description?: string;
  enabled: boolean;
  rules: Rule[];
};
export type UserContext = Record<string, string>;
export type EvalResult = {
  variant: string | null;
  reason: "disabled" | "rule_match" | "default" | "no_match";
  matchedRuleId?: string;
};

export function evaluate(flag: Flag, context: UserContext): EvalResult {
  if (!flag.enabled) return { variant: null, reason: "disabled" };
  for (const rule of flag.rules) {
    if (rule.kind === "default")
      return {
        variant: rule.variant,
        reason: "default",
        matchedRuleId: rule.id,
      };
    if (
      rule.conditions.length > 0 &&
      rule.conditions.every(
        (c) =>
          Object.hasOwn(context, c.attribute) &&
          context[c.attribute] === c.value,
      )
    )
      return {
        variant: rule.variant,
        reason: "rule_match",
        matchedRuleId: rule.id,
      };
  }
  return { variant: null, reason: "no_match" };
}

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const nonempty = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
export function isFlags(value: unknown): value is Flag[] {
  if (!Array.isArray(value)) return false;
  const keys = new Set<string>();
  return value.every((flag) => {
    if (
      !object(flag) ||
      !nonempty(flag.key) ||
      keys.has(flag.key) ||
      typeof flag.enabled !== "boolean" ||
      (flag.description !== undefined &&
        typeof flag.description !== "string") ||
      !Array.isArray(flag.rules)
    )
      return false;
    keys.add(flag.key);
    const ids = new Set<string>();
    const rules = flag.rules;
    return rules.every((rule: unknown, index: number) => {
      if (
        !object(rule) ||
        !nonempty(rule.id) ||
        ids.has(rule.id) ||
        !nonempty(rule.variant)
      )
        return false;
      ids.add(rule.id);
      if (rule.kind === "default")
        return index === rules.length - 1 && !("conditions" in rule);
      return (
        rule.kind === "match" &&
        Array.isArray(rule.conditions) &&
        rule.conditions.length > 0 &&
        rule.conditions.every(
          (c: unknown) =>
            object(c) &&
            nonempty(c.attribute) &&
            c.op === "eq" &&
            typeof c.value === "string",
        )
      );
    });
  });
}
