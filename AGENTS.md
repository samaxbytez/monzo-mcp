# AGENTS.md

Project guidance for AI coding agents working in this repository.

## What this is

`monzo-mcp`: an MCP (Model Context Protocol) server that exposes the
[Monzo](https://docs.monzo.com) banking API as tools for LLM clients. TypeScript,
ESM, published to npm, driven over stdio.

## Architecture

```
src/
├── index.ts     # Entry point: builds the McpServer, wires the client, registers every tool group
├── client.ts    # MonzoClient: fetch wrapper with path/origin checks, no redirects, 30s timeout
├── policy.ts    # withToolPolicy: MCP annotations for every tool; money-moving tools behind MONZO_ENABLE_SENSITIVE_TOOLS
├── utils.ts     # runTool, jsonResponse, errorResponse, logToolCall, definedOnly, safeId, stripAttachmentLinks
└── tools/       # One file per Monzo resource, each exporting registerXxxTools(server, client)
```

Tests are co-located as `*.test.ts` and run with **vitest**. `npm run build`
bundles the server, the MCP SDK and zod into `build/index.js` with esbuild
(`scripts/bundle.mjs`): the published package has no runtime dependencies, so keep
the SDK and zod in devDependencies and never add runtime `dependencies`.
`npm run smoke` starts the bundle over MCP and checks it.

## Tool pattern

Register with `server.registerTool(name, config, handler)` and run the body through
`runTool(name, loggedArgs, () => client.xxx(...))`, which logs, serialises and turns
errors into MCP error results. Use `definedOnly()` for optional query params.

## Security conventions (threat model: indirect prompt injection)

Text Monzo returns (merchant names, notes, references) can be written by third
parties, so every tool argument is attacker-controlled and Monzo is a bank.

- **IDs in request paths use `safeId`**, never a plain `z.string()`.
- **`client.ts` guards stay intact**: only plain `/a/b` paths, no `..`, encoding,
  scheme or host, and the resolved origin and base path are checked. Redirects are
  refused so the bearer token only ever goes to the API host.
- **Tools that move money or send data out are gated** by `SENSITIVE_TOOLS` in
  `policy.ts` and need `MONZO_ENABLE_SENSITIVE_TOOLS=true`. A new tool that does
  either goes there. Every tool gets annotations from `annotationsFor`.
- **No pre-signed download links** reach the model (`stripAttachmentLinks`).
- URLs sent to Monzo are https only; strings have length caps.
- The token is never logged or echoed into errors; non-JSON error bodies are not echoed.
- No new subprocess, file read/write or outbound request without a security review.

## Commits and releases

Conventional commits; `main` squash-merges so the PR title is the commit. Never
push to `main`. Releases: `/release` opens the PR, you merge, approve `npm-publish`
in Actions. See [RELEASING.md](RELEASING.md). No AI attribution in commits or PRs.

## Docs

[docs/](docs/README.md) holds setup, configuration, tools, security,
troubleshooting and development. Keep tool counts right with `/sync-tool-count`
and scaffold tools with `/add-tool`.
