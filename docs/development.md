# Development

Node.js 24 or later. [AGENTS.md](../AGENTS.md) has the conventions and the security
rules that don't bend: read it before changing anything.

```bash
npm install
npm run type-check
npm test               # vitest, no network: fetch is mocked
npm run lint
npm run format
npm run build          # bundle into build/index.js (scripts/bundle.mjs)
npm run smoke          # start the bundle over MCP and check what clients see
```

The published package has **no runtime dependencies**: `npm run build` bundles the
server, the MCP SDK and zod into one file with esbuild, plus
`build/THIRD_PARTY_LICENSES.txt`. The SDK and zod are devDependencies; a version
change to either reaches users in the next release. CI runs lint, type-check, tests,
build and smoke on Node 24 (`test (24)`).

## What's where

```
src/
├── index.ts          # Entry point
├── client.ts         # MonzoClient: path and origin checks, no redirects, timeout
├── policy.ts         # Annotations; sensitive tools behind an opt-in
├── utils.ts          # runTool, safeId, definedOnly, stripAttachmentLinks, …
├── *.test.ts         # Tests beside each module
└── tools/
    ├── accounts.ts      # 3 tools
    ├── pots.ts          # 3 tools
    ├── transactions.ts  # 3 tools
    ├── feed.ts          # 1 tool
    ├── attachments.ts   # 3 tools
    ├── receipts.ts      # 3 tools
    ├── webhooks.ts      # 3 tools
    └── tools.test.ts    # Handler tests
scripts/
├── bundle.mjs        # esbuild bundle + third-party licences
└── smoke.mjs         # Post-build check over MCP stdio
```

## Adding a tool

Run `/add-tool` in Claude Code, or by hand:

1. Add it to a file in `src/tools/` with `server.registerTool` and `runTool`.
2. Use `safeId` for every ID, `definedOnly` for optional params.
3. If it moves money or sends data out, add it to `SENSITIVE_TOOLS` in `src/policy.ts`.
4. Add tests; add path IDs to `PATH_ARGS` in `src/policy.test.ts`.
5. Run `/sync-tool-count` to update counts and the smoke test.

## Releasing

Run `/release` on an up-to-date `main`: it opens the `chore: release X.Y.Z` PR.
Merging it builds the release; approving the `npm-publish` deployment in Actions
publishes to npm and tags it. Never run `npm publish` or create tags by hand. See
[RELEASING.md](../RELEASING.md).
