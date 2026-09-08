import { describe, expect, it } from "vitest";
import { evaluate, isFlags, type Flag } from "./model";
const flag: Flag = {
  key: "test",
  enabled: true,
  rules: [
    {
      id: "specific",
      kind: "match",
      conditions: [
        { attribute: "country", op: "eq", value: "UK" },
        { attribute: "plan", op: "eq", value: "pro" },
      ],
      variant: "a",
    },
    {
      id: "general",
      kind: "match",
      conditions: [{ attribute: "country", op: "eq", value: "UK" }],
      variant: "b",
    },
    { id: "fallback", kind: "default", variant: "control" },
  ],
};
describe("evaluation contract", () => {
  it("selects the first matching rule and exposes its identity", () =>
    expect(evaluate(flag, { country: "UK", plan: "pro" })).toEqual({
      variant: "a",
      reason: "rule_match",
      matchedRuleId: "specific",
    }));
  it("requires all conditions and falls through when one is missing", () =>
    expect(evaluate(flag, { country: "UK" }).variant).toBe("b"));
  it("does not coerce or normalize context values", () =>
    expect(evaluate(flag, { country: "uk", plan: "pro" }).reason).toBe(
      "default",
    ));
  it("returns the default with its identity", () =>
    expect(evaluate(flag, {})).toEqual({
      variant: "control",
      reason: "default",
      matchedRuleId: "fallback",
    }));
  it("short circuits disabled flags", () =>
    expect(
      evaluate({ ...flag, enabled: false }, { country: "UK", plan: "pro" }),
    ).toEqual({ variant: null, reason: "disabled" }));
  it("handles absent default", () =>
    expect(evaluate({ ...flag, rules: flag.rules.slice(0, 2) }, {})).toEqual({
      variant: null,
      reason: "no_match",
    }));
  it("ignores inherited context attributes", () =>
    expect(
      evaluate(flag, Object.create({ country: "UK", plan: "pro" })).reason,
    ).toBe("default"));
  it("does not match an empty condition list", () =>
    expect(
      evaluate(
        {
          ...flag,
          rules: [{ id: "empty", kind: "match", conditions: [], variant: "a" }],
        },
        {},
      ).reason,
    ).toBe("no_match"));
});
describe("stored data validation", () => {
  it("accepts valid flags and empty collections", () => {
    expect(isFlags([flag])).toBe(true);
    expect(isFlags([])).toBe(true);
  });
  it.each([
    null,
    [{}],
    [{ ...flag, rules: [flag.rules[2], flag.rules[0]] }],
    [flag, flag],
    [{ ...flag, rules: [flag.rules[0], flag.rules[0]] }],
    [
      {
        ...flag,
        rules: [{ id: "bad", kind: "match", conditions: [], variant: "a" }],
      },
    ],
    [
      {
        ...flag,
        rules: [
          {
            id: "bad",
            kind: "match",
            conditions: [{ attribute: "x", op: "neq", value: "a" }],
            variant: "a",
          },
        ],
      },
    ],
  ])("rejects malformed data %#", (value) =>
    expect(isFlags(value)).toBe(false),
  );
});
