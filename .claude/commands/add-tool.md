---
description: Scaffold a new Monzo MCP tool (handler + registration + test) following the repo pattern
argument-hint: <resource-file> "<tool description>"
---

Add a new tool to this MCP server. Arguments: `$ARGUMENTS`
(first token = the `src/tools/<resource>.ts` file to add it to or create;
the rest = a short description of what the tool does).

Read an existing tool first (e.g. `src/tools/webhooks.ts`) and mirror it.

1. Decide the tool name (`monzo_<verb>_<resource>`), HTTP method and API path
   from the [Monzo API docs](https://docs.monzo.com).
2. In `src/tools/<resource>.ts`:
   - A new file exports `registerXxxTools(server, client)`; call it from `src/index.ts`.
   - Register with `server.registerTool(name, { title, description, inputSchema }, handler)`
     and run the body through `runTool(name, loggedArgs, () => client...)`.
   - **Any ID that is interpolated into a request path uses `safeId`**, never a plain
     `z.string()`. Use `safeId` for other IDs too.
   - Use `definedOnly(...)` for optional query parameters; use `https`-only `z.url()`
     for URLs; cap string lengths.
   - A list tool returns pagination info (see `monzo_list_transactions`).
3. Decide its safety class in `src/policy.ts`: a tool that **moves money or sends
   data out of the account** goes in `SENSITIVE_TOOLS`; check `annotationsFor`
   gives it the right hints (read-only, destructive, open-world).
4. Strip any pre-signed download link from what it returns.
5. Add tests in `src/tools/tools.test.ts` and, for path IDs, extend `PATH_ARGS` in
   `src/policy.test.ts`. Update `SENSITIVE`/counts in `scripts/smoke.mjs`.
6. Add the tool to `docs/tools.md`, then run `/sync-tool-count`.
7. Run `npm run lint`, `npm run type-check`, `npm test`, `npm run build`, `npm run smoke`.

Do not invent API fields; confirm them against the Monzo docs. Stop and ask if
the API shape is unclear.
