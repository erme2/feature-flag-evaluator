import { useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Flag as FlagIcon,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  evaluate,
  isFlags,
  type Flag,
  type Rule,
  type UserContext,
} from "./model";

export type FeatureFlagEvaluatorProps = {
  initialFlags: Flag[];
  initialContext?: UserContext;
  onChange?: (flags: Flag[]) => void;
  /** Opt in to browser storage. Use a different key for each independent widget. */
  persistenceKey?: string;
  className?: string;
};

function load(flags: Flag[], key?: string) {
  if (!isFlags(flags))
    throw new Error("FeatureFlagEvaluator: initialFlags are invalid");
  if (!key || typeof window === "undefined") return { flags, notice: "" };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { flags, notice: "" };
    const saved: unknown = JSON.parse(raw);
    if (
      typeof saved === "object" &&
      saved !== null &&
      "schemaVersion" in saved &&
      saved.schemaVersion === 1 &&
      "flags" in saved &&
      isFlags(saved.flags)
    )
      return { flags: saved.flags, notice: "" };
    return { flags, notice: "Saved data was invalid. Initial flags loaded." };
  } catch {
    return {
      flags,
      notice: "Saved data could not be read. Initial flags loaded.",
    };
  }
}

function RuleEditor({
  rule,
  onSave,
  onCancel,
}: {
  rule: Rule;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Rule>(() => structuredClone(rule));
  const valid =
    draft.variant.trim() &&
    (draft.kind === "default" ||
      (draft.conditions.length > 0 &&
        draft.conditions.every((c) => c.attribute.trim())));
  return (
    <form
      className="ffe-editor"
      aria-label="Edit rule"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(draft);
      }}
    >
      {draft.kind === "match" && (
        <>
          {draft.conditions.map((condition, index) => (
            <div className="ffe-condition-fields" key={index}>
              <label>
                Attribute
                <input
                  aria-label={`Attribute ${index + 1}`}
                  value={condition.attribute}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      conditions: draft.conditions.map((c, i) =>
                        i === index ? { ...c, attribute: e.target.value } : c,
                      ),
                    })
                  }
                />
              </label>
              <span className="ffe-equals">equals</span>
              <label>
                Value
                <input
                  aria-label={`Value ${index + 1}`}
                  value={condition.value}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      conditions: draft.conditions.map((c, i) =>
                        i === index ? { ...c, value: e.target.value } : c,
                      ),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="ffe-icon"
                title={`Remove condition ${index + 1}`}
                aria-label={`Remove condition ${index + 1}`}
                disabled={draft.conditions.length === 1}
                onClick={() =>
                  setDraft({
                    ...draft,
                    conditions: draft.conditions.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="ffe-text-button"
            onClick={() =>
              setDraft({
                ...draft,
                conditions: [
                  ...draft.conditions,
                  { attribute: "", op: "eq", value: "" },
                ],
              })
            }
          >
            <Plus size={14} />
            Add condition
          </button>
        </>
      )}
      <label className="ffe-variant-field">
        Returned variant
        <input
          autoFocus
          value={draft.variant}
          onChange={(e) => setDraft({ ...draft, variant: e.target.value })}
        />
      </label>
      <div className="ffe-editor-actions">
        <button type="button" onClick={onCancel}>
          <X size={14} />
          Cancel
        </button>
        <button className="ffe-primary" disabled={!valid} type="submit">
          <Check size={14} />
          Save rule
        </button>
      </div>
    </form>
  );
}

export function FeatureFlagEvaluator({
  initialFlags,
  initialContext = {},
  onChange,
  persistenceKey,
  className = "",
}: FeatureFlagEvaluatorProps) {
  const [loaded] = useState(() => load(initialFlags, persistenceKey));
  const [flags, setFlags] = useState(loaded.flags);
  const current = useRef(flags);
  const [notice, setNotice] = useState(loaded.notice);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<{
    key: string;
    rule: Rule;
    adding?: boolean;
  } | null>(null);
  const [rows, setRows] = useState(() =>
    Object.entries(initialContext).map(([key, value], id) => ({
      id,
      key,
      value,
    })),
  );
  const nextRow = useRef(rows.length);
  const [resetConfirm, setResetConfirm] = useState(false);
  const titleId = useId();
  const keys = rows.map((r) => r.key);
  const invalidContext =
    rows.some((r) => !r.key.trim()) || new Set(keys).size !== keys.length;
  const context: UserContext = Object.fromEntries(
    rows.map((r) => [r.key, r.value]),
  );

  function commit(next: Flag[]) {
    current.current = next;
    setFlags(next);
    setNotice("");
    if (persistenceKey) {
      try {
        window.localStorage.setItem(
          persistenceKey,
          JSON.stringify({ schemaVersion: 1, flags: next }),
        );
        setSaved(true);
      } catch {
        setSaved(false);
        setNotice(
          "Changes are in memory only. Browser storage is unavailable or full.",
        );
      }
    }
    onChange?.(structuredClone(next));
  }
  function updateFlag(key: string, update: (flag: Flag) => Flag) {
    commit(current.current.map((f) => (f.key === key ? update(f) : f)));
  }
  function move(key: string, index: number, direction: number) {
    updateFlag(key, (flag) => {
      const rules = [...flag.rules];
      [rules[index], rules[index + direction]] = [
        rules[index + direction],
        rules[index],
      ];
      return { ...flag, rules };
    });
  }
  function saveRule(rule: Rule) {
    if (!editing) return;
    updateFlag(editing.key, (flag) => ({
      ...flag,
      rules: editing.adding
        ? [
            ...flag.rules.filter((r) => r.kind === "match"),
            rule,
            ...flag.rules.filter((r) => r.kind === "default"),
          ]
        : flag.rules.map((r) => (r.id === rule.id ? rule : r)),
    }));
    setEditing(null);
  }
  return (
    <section className={`ffe ${className}`} aria-labelledby={titleId}>
      <header className="ffe-header">
        <div className="ffe-heading">
          <FlagIcon size={23} />
          <div>
            <h1 id={titleId}>Feature flags</h1>
            <span>
              {flags.length} flags <span aria-hidden="true">/</span>{" "}
              {flags.filter((f) => f.enabled).length} enabled
            </span>
          </div>
        </div>
        <div className="ffe-header-actions">
          <span className="ffe-storage">
            {persistenceKey
              ? saved
                ? "Saved locally"
                : "Local storage"
              : "Session only"}
          </span>
          <button title="Reset flags" onClick={() => setResetConfirm(true)}>
            <RotateCcw size={15} />
            Reset
          </button>
        </div>
      </header>
      {notice && (
        <p role="status" className="ffe-notice">
          {notice}
        </p>
      )}
      {resetConfirm && (
        <div className="ffe-reset" role="group" aria-label="Confirm reset">
          <span>Replace all flags with their initial values?</span>
          <button onClick={() => setResetConfirm(false)}>Cancel</button>
          <button
            onClick={() => {
              commit(structuredClone(initialFlags));
              setEditing(null);
              setResetConfirm(false);
            }}
          >
            Reset flags
          </button>
        </div>
      )}
      <div className="ffe-layout">
        <div className="ffe-flags">
          {flags.length === 0 && <p className="ffe-empty">No flags</p>}
          {flags.map((flag) => {
            const result = invalidContext ? null : evaluate(flag, context);
            return (
              <article
                className="ffe-flag"
                key={flag.key}
                aria-label={flag.key}
              >
                <div className="ffe-flag-heading">
                  <div>
                    <h2>{flag.key}</h2>
                    {flag.description && <p>{flag.description}</p>}
                  </div>
                  <label className="ffe-toggle">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label={`Enable ${flag.key}`}
                      checked={flag.enabled}
                      onChange={(e) =>
                        updateFlag(flag.key, (f) => ({
                          ...f,
                          enabled: e.target.checked,
                        }))
                      }
                    />
                    <span>{flag.enabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </div>
                <div className="ffe-rule-label">
                  <span>
                    RULES <span className="ffe-count">{flag.rules.length}</span>
                  </span>
                  <span>RETURN</span>
                </div>
                <ol className="ffe-rules">
                  {flag.rules.map((rule, index) => (
                    <li
                      className={
                        result?.matchedRuleId === rule.id ? "ffe-matched" : ""
                      }
                      key={rule.id}
                    >
                      {editing?.key === flag.key &&
                      editing.rule.id === rule.id ? (
                        <RuleEditor
                          rule={editing.rule}
                          onSave={saveRule}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <div className="ffe-rule">
                          <span className="ffe-rule-number">
                            {rule.kind === "default"
                              ? "*"
                              : String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="ffe-rule-body">
                            {rule.kind === "default" ? (
                              <span className="ffe-default">Otherwise</span>
                            ) : (
                              rule.conditions.map((c, i) => (
                                <span className="ffe-condition" key={i}>
                                  {i > 0 && <small>AND </small>}
                                  <strong>{c.attribute}</strong>
                                  <span> = </span>
                                  <code>{JSON.stringify(c.value)}</code>
                                </span>
                              ))
                            )}
                            {result?.matchedRuleId === rule.id && (
                              <span className="ffe-match-label">
                                <Check size={12} />
                                Matched
                              </span>
                            )}
                          </div>
                          <code className="ffe-variant">{rule.variant}</code>
                          <div className="ffe-rule-actions">
                            <button
                              className="ffe-icon"
                              title={`Edit rule ${index + 1}`}
                              aria-label={`Edit rule ${index + 1}`}
                              disabled={editing !== null}
                              onClick={() =>
                                setEditing({ key: flag.key, rule })
                              }
                            >
                              <Pencil size={14} />
                            </button>
                            {rule.kind === "match" && (
                              <>
                                <button
                                  className="ffe-icon"
                                  title="Move rule up"
                                  aria-label={`Move rule ${index + 1} up`}
                                  disabled={index === 0 || editing !== null}
                                  onClick={() => move(flag.key, index, -1)}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  className="ffe-icon"
                                  title="Move rule down"
                                  aria-label={`Move rule ${index + 1} down`}
                                  disabled={
                                    flag.rules[index + 1]?.kind !== "match" ||
                                    editing !== null
                                  }
                                  onClick={() => move(flag.key, index, 1)}
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </>
                            )}
                            <button
                              className="ffe-icon"
                              title={`Delete rule ${index + 1}`}
                              aria-label={`Delete rule ${index + 1}`}
                              disabled={editing !== null}
                              onClick={() =>
                                updateFlag(flag.key, (f) => ({
                                  ...f,
                                  rules: f.rules.filter(
                                    (r) => r.id !== rule.id,
                                  ),
                                }))
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
                {editing?.key === flag.key && editing.adding && (
                  <RuleEditor
                    key={editing.rule.id}
                    rule={editing.rule}
                    onSave={saveRule}
                    onCancel={() => setEditing(null)}
                  />
                )}
                <footer className="ffe-flag-footer">
                  <button
                    className="ffe-text-button"
                    disabled={editing !== null}
                    onClick={() =>
                      setEditing({
                        key: flag.key,
                        adding: true,
                        rule: {
                          id: crypto.randomUUID(),
                          kind: "match",
                          conditions: [{ attribute: "", op: "eq", value: "" }],
                          variant: "control",
                        },
                      })
                    }
                  >
                    <Plus size={14} />
                    Add rule
                  </button>
                  {!flag.rules.some((r) => r.kind === "default") && (
                    <button
                      className="ffe-text-button"
                      disabled={editing !== null}
                      onClick={() =>
                        setEditing({
                          key: flag.key,
                          adding: true,
                          rule: {
                            id: crypto.randomUUID(),
                            kind: "default",
                            variant: "control",
                          },
                        })
                      }
                    >
                      <Plus size={14} />
                      Add default
                    </button>
                  )}
                  <span className="ffe-result">
                    {result ? (
                      result.reason === "disabled" ? (
                        "Disabled"
                      ) : result.reason === "no_match" ? (
                        "No match"
                      ) : (
                        <>
                          Result <code>{result.variant}</code>
                        </>
                      )
                    ) : (
                      "Context incomplete"
                    )}
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
        <aside className="ffe-context" aria-label="User context">
          <div className="ffe-panel-title">
            <h2>User context</h2>
            <span className="ffe-live">
              <i />
              Live
            </span>
          </div>
          <div className="ffe-context-rows">
            {rows.map((row, index) => (
              <div className="ffe-context-row" key={row.id}>
                <label>
                  Attribute
                  <input
                    aria-label={`Context attribute ${index + 1}`}
                    value={row.key}
                    onChange={(e) =>
                      setRows(
                        rows.map((r) =>
                          r.id === row.id ? { ...r, key: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Value
                  <input
                    aria-label={`Context value ${index + 1}`}
                    value={row.value}
                    onChange={(e) =>
                      setRows(
                        rows.map((r) =>
                          r.id === row.id ? { ...r, value: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  className="ffe-icon"
                  aria-label={`Remove context attribute ${index + 1}`}
                  title="Remove attribute"
                  onClick={() => setRows(rows.filter((r) => r.id !== row.id))}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="ffe-text-button"
            onClick={() =>
              setRows([...rows, { id: nextRow.current++, key: "", value: "" }])
            }
          >
            <Plus size={14} />
            Add attribute
          </button>
          {invalidContext && (
            <p role="status" className="ffe-context-error">
              Attribute names must be nonempty and unique.
            </p>
          )}
          <div className="ffe-results">
            <h3>Evaluation results</h3>
            <div aria-live="polite">
              {flags.map((flag) => {
                const result = invalidContext ? null : evaluate(flag, context);
                return (
                  <div className="ffe-summary" key={flag.key}>
                    <span>{flag.key}</span>
                    <strong>
                      {result?.variant ??
                        (result
                          ? result.reason === "disabled"
                            ? "Disabled"
                            : "No match"
                          : "Pending")}
                    </strong>
                    <small>
                      {result?.reason === "rule_match"
                        ? `Rule ${flag.rules.findIndex((r) => r.id === result.matchedRuleId) + 1} matched`
                        : result?.reason === "default"
                          ? "Default rule"
                          : ""}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
