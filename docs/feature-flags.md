# Feature flag concepts

[Back to the README](../README.md)

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
