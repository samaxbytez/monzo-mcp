---
description: Recount the tools in src/tools and update the counts in the docs
---

The docs state tool counts in several places. Reconcile them with the source.

1. Count `server.registerTool(` calls per file in `src/tools/*.ts`, and how many
   names are in `SENSITIVE_TOOLS` in `src/policy.ts`. Default count = total minus
   sensitive; "with sensitive tools" = total.
2. Update:
   - `README.md`: the intro, the "What it can do" table, and "All N tools";
   - `docs/tools.md`: the opening line and each "## <Group> (N tools)" heading;
   - `docs/development.md`: per-file counts in the tree;
   - `docs/README.md`: "All N tools";
   - `scripts/smoke.mjs`: the expected default tool count.
3. Show a short before/after of the numbers changed. Do not touch other prose.

Docs and smoke-test constants only; no other source changes.
