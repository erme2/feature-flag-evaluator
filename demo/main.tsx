import React from "react";
import { createRoot } from "react-dom/client";
import { FeatureFlagEvaluator, type Flag } from "../src";
import "./style.css";
import "./widget.css";
const flags: Flag[] = [
  {
    key: "new_checkout",
    description: "A refreshed checkout for UK customers",
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
      {
        id: "checkout-uk",
        kind: "match",
        conditions: [{ attribute: "country", op: "eq", value: "UK" }],
        variant: "variant_b",
      },
      { id: "checkout-default", kind: "default", variant: "control" },
    ],
  },
  {
    key: "search_preview",
    description: "Early access for the internal team",
    enabled: true,
    rules: [
      {
        id: "search-team",
        kind: "match",
        conditions: [{ attribute: "team", op: "eq", value: "internal" }],
        variant: "preview",
      },
      { id: "search-default", kind: "default", variant: "standard" },
    ],
  },
  {
    key: "maintenance_banner",
    description: "Global service announcement",
    enabled: false,
    rules: [{ id: "banner-default", kind: "default", variant: "visible" }],
  },
  {
    key: "priority_support",
    description: "Dedicated support for enterprise accounts",
    enabled: true,
    rules: [
      {
        id: "support-enterprise",
        kind: "match",
        conditions: [{ attribute: "plan", op: "eq", value: "enterprise" }],
        variant: "priority",
      },
    ],
  },
];
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className="demo-shell">
      <div className="demo-top">
        <span>LAB / 001</span>
        <span>Feature Flag Evaluator</span>
        <span>POC</span>
      </div>
      <FeatureFlagEvaluator
        initialFlags={flags}
        initialContext={{ country: "UK", plan: "pro" }}
        persistenceKey="ffe:demo:v1"
      />
      <footer className="demo-footer">
        Feature Flag Evaluator <span>React widget / Local environment</span>
      </footer>
    </div>
  </React.StrictMode>,
);
