# monzo-mcp

[![CI](https://github.com/samaxbytez/monzo-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/samaxbytez/monzo-mcp/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/monzo-mcp.svg)](https://www.npmjs.com/package/monzo-mcp)
![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-5FA04E?logo=nodedotjs&logoColor=white)
![MCP SDK 1.32](https://img.shields.io/badge/MCP_SDK-1.32-555555)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- The Node.js and MCP SDK badges are static: change them with package.json's engines and @modelcontextprotocol/sdk. -->

An [MCP](https://modelcontextprotocol.io) server that gives Claude, Codex, Cursor,
VS Code, Gemini CLI or any other MCP client the [Monzo](https://docs.monzo.com)
banking API: 15 tools for balances, transactions, pots, receipts and
attachments, plus 4 that move money or send data out and are off until you opt in.

Text that comes back from Monzo, such as a merchant name or transaction note, can
be written by someone else, so the server assumes it may carry instructions aimed
at the model. Tools that move money or send data out of the account are **off by
default**, and every tool says whether it reads, writes or deletes.

> **Note:** the Monzo Developer API is for personal use. You can only connect to your own account.

## Contents

- [How it fits together](#how-it-fits-together)
- [Quick start](#quick-start)
- [What it can do](#what-it-can-do)
- [Settings](#settings)
- [Development](#development)
- [Documentation](#documentation)
- [Links](#links)

## How it fits together

```
Claude, Codex, Cursor, VS Code, … ──stdio──▶ monzo-mcp (Node.js, on your machine)
                                                   ├─ 15 tools; 4 more only with MONZO_ENABLE_SENSITIVE_TOOLS
                                                   ├─ your access token comes from the MONZO_ACCESS_TOKEN env var
                                                   └──HTTPS, bearer token, no redirects──▶ api.monzo.com
```

The server runs locally, started by your MCP client, and talks to nothing but
Monzo's API. ChatGPT and Grok only connect to MCP servers hosted on the internet,
so they can't use it yet ([details](docs/configuration.md#chatgpt-and-grok)).

## Quick start

Node.js 24 or later and a Monzo account. **New to this? See
[docs/setup.md](docs/setup.md).**

1. **Get an access token** from the
   [Monzo API Playground](https://developers.monzo.com/api/playground): click
   **Auth**, approve the push notification in your Monzo app, copy the token. It
   lasts about 6 hours.
2. **Add it to your AI app.** `claude_desktop_config.json` for Claude Desktop,
   `.mcp.json` for Claude Code. Other clients:
   [docs/configuration.md](docs/configuration.md#mcp-clients).

   ```json
   {
     "mcpServers": {
       "monzo": {
         "command": "npx",
         "args": ["-y", "monzo-mcp"],
         "env": { "MONZO_ACCESS_TOKEN": "your_access_token_here" }
       }
     }
   }
   ```

3. **Restart the client and ask:** "What's my Monzo balance?"

## What it can do

| Area | Tools | Examples |
| --- | --- | --- |
| Accounts | 3 | Who am I, list accounts, balance and spend today |
| Pots | 1 (+2) | List pots; deposit and withdraw need the opt-in |
| Transactions | 3 | List (paged), get one, annotate with metadata |
| Feed | 0 (+1) | Create an app feed item (opt-in) |
| Attachments | 3 | Upload, register and remove transaction images |
| Receipts | 3 | Create, get and delete itemised receipts |
| Webhooks | 2 (+1) | List and delete; registering one needs the opt-in |

Amounts are in pence. Full list: [docs/tools.md](docs/tools.md).

## Settings

| Variable | Required | What it does |
| --- | --- | --- |
| `MONZO_ACCESS_TOKEN` | Yes | Your Monzo API access token |
| `MONZO_ENABLE_SENSITIVE_TOOLS` | No | `true` registers pot deposit/withdraw, webhook registration and feed items |
| `MONZO_API_URL` | No | Override the API base URL (https, or http on loopback); for testing |

More in [docs/configuration.md](docs/configuration.md).

## Development

```bash
npm install
npm test && npm run lint && npm run type-check
npm run build && npm run smoke
```

See [docs/development.md](docs/development.md) and [AGENTS.md](AGENTS.md).

## Documentation

| Doc | What |
| --- | --- |
| [docs/setup.md](docs/setup.md) | Get a token and add the server to your AI app |
| [docs/configuration.md](docs/configuration.md) | Settings and config for each AI app |
| [docs/tools.md](docs/tools.md) | All 19 tools |
| [docs/security.md](docs/security.md) | Threat model and what is gated |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common errors |
| [docs/development.md](docs/development.md) | Build, test, add a tool, release |

## Links

- [npm](https://www.npmjs.com/package/monzo-mcp) · [Issues](https://github.com/samaxbytez/monzo-mcp/issues) · [Changelog](CHANGELOG.md) · [Monzo API docs](https://docs.monzo.com)

MIT licensed.
