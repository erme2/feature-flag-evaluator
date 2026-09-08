import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureFlagEvaluator } from "./widget";
import type { Flag } from "./model";
const localStorage = window.localStorage;
const seed: Flag[] = [
  {
    key: "checkout",
    enabled: true,
    rules: [
      {
        id: "uk",
        kind: "match",
        conditions: [{ attribute: "country", op: "eq", value: "UK" }],
        variant: "a",
      },
      { id: "default", kind: "default", variant: "control" },
    ],
  },
];
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
it("keeps draft changes isolated until saved and emits the updated flags", async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  render(
    <FeatureFlagEvaluator
      initialFlags={seed}
      initialContext={{ country: "UK" }}
      onChange={changed}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Edit rule 1" }));
  await user.clear(screen.getByLabelText("Returned variant"));
  await user.type(screen.getByLabelText("Returned variant"), "new");
  expect(changed).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Save rule" }));
  expect(changed.mock.calls[0][0][0].rules[0].variant).toBe("new");
  expect(seed[0].rules[0].variant).toBe("a");
});
it("cancels edits without changing flags and prevents deleting the last condition", async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  render(<FeatureFlagEvaluator initialFlags={seed} onChange={changed} />);
  await user.click(screen.getByRole("button", { name: "Edit rule 1" }));
  expect(
    (
      screen.getByRole("button", {
        name: "Remove condition 1",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await user.click(screen.getByRole("button", { name: "Add condition" }));
  expect(
    (screen.getByRole("button", { name: "Save rule" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(changed).not.toHaveBeenCalled();
});
it("persists immediately and loads saved changes on remount", async () => {
  const user = userEvent.setup();
  const view = render(
    <FeatureFlagEvaluator initialFlags={seed} persistenceKey="test" />,
  );
  await user.click(screen.getByRole("switch"));
  expect(JSON.parse(localStorage.getItem("test")!).flags[0].enabled).toBe(
    false,
  );
  view.unmount();
  render(<FeatureFlagEvaluator initialFlags={seed} persistenceKey="test" />);
  expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(false);
});
it("reports invalid storage and write failures without losing edits", async () => {
  localStorage.setItem(
    "test",
    JSON.stringify({ schemaVersion: 1, flags: [{}] }),
  );
  const user = userEvent.setup();
  render(<FeatureFlagEvaluator initialFlags={seed} persistenceKey="test" />);
  expect(screen.getByRole("status").textContent).toContain("invalid");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("full");
  });
  await user.click(screen.getByRole("switch"));
  expect(screen.getByRole("status").textContent).toContain("memory only");
  expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(false);
});
it("keeps multiple widget instances independent without persistence", async () => {
  const user = userEvent.setup();
  render(
    <>
      <FeatureFlagEvaluator initialFlags={seed} />
      <FeatureFlagEvaluator initialFlags={seed} />
    </>,
  );
  const switches = screen.getAllByRole("switch") as HTMLInputElement[];
  await user.click(switches[0]);
  expect(switches[1].checked).toBe(true);
  expect(localStorage.length).toBe(0);
});
it("pauses evaluation for duplicate context attributes", async () => {
  const user = userEvent.setup();
  render(
    <FeatureFlagEvaluator
      initialFlags={seed}
      initialContext={{ country: "UK" }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Add attribute" }));
  await user.type(screen.getByLabelText("Context attribute 2"), "country");
  expect(screen.getByRole("status").textContent).toContain("unique");
  expect(
    within(screen.getByRole("article")).getByText("Context incomplete"),
  ).toBeTruthy();
});
