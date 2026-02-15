# monzo-mcp

[![npm version](https://img.shields.io/npm/v/monzo-mcp.svg)](https://www.npmjs.com/package/monzo-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server for the [Monzo banking API](https://docs.monzo.com). Connect Claude and other AI assistants to your Monzo account to check balances, view transactions, manage pots, and more.

Works with any MCP-compatible client, including Claude Desktop, Claude Code, Cursor, Windsurf, Cline, and others. Provides 19 tools covering accounts, transactions, pots, feed items, attachments, receipts, and webhooks.

> **Note:** The Monzo Developer API is for personal use only. You can only connect to your own account or a small number of explicitly allowed users.

## Features

- **Accounts** - Verify identity, list accounts, get balance
- **Pots** - List pots, deposit into and withdraw from pots
- **Transactions** - List transactions, get details, annotate with metadata
- **Feed** - Create custom feed items in the Monzo app
- **Attachments** - Upload images and attach them to transactions
- **Receipts** - Create, get, and delete digital receipts
- **Webhooks** - Register, list, and delete real-time webhooks

## Prerequisites

You need a **Monzo Access Token**. To get one:

1. Go to [developers.monzo.com](https://developers.monzo.com) and log in with your Monzo email
2. Go to the [API Playground](https://developers.monzo.com/api/playground) and click **Auth**
3. Approve the **push notification** on your Monzo app (PIN, fingerprint, or Face ID)
4. Copy the **Access Token** shown in the Playground

**Important notes about tokens:**
- Tokens expire after approximately **6 hours**
- After authentication, you have **5 minutes** of full transaction history access; after that, only the **last 90 days** are available
- Generating a new token **invalidates** the previous one

## Installation

### Using npx (recommended)

```bash
npx monzo-mcp
```

### Global install

```bash
npm install -g monzo-mcp
monzo-mcp
```

### Build from source

```bash
git clone https://github.com/samaxbytez/monzo-mcp.git
cd monzo-mcp
npm install
npm run build
node build/index.js
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONZO_ACCESS_TOKEN` | Yes | Your Monzo API access token |

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "monzo": {
      "command": "npx",
      "args": ["-y", "monzo-mcp"],
      "env": {
        "MONZO_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "monzo": {
      "command": "npx",
      "args": ["-y", "monzo-mcp"],
      "env": {
        "MONZO_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

### Other MCP Clients

Set the `MONZO_ACCESS_TOKEN` environment variable and run:

```bash
MONZO_ACCESS_TOKEN=your_token npx monzo-mcp
```

## Architecture

```
monzo-mcp/
├── src/
│   ├── index.ts              # Entry point, server setup
│   ├── client.ts             # Monzo API HTTP client
│   ├── utils.ts              # Shared utilities (jsonResponse, errorResponse, etc.)
│   ├── client.test.ts        # Client tests
│   ├── utils.test.ts         # Utils tests
│   └── tools/
│       ├── accounts.ts       # Account info and balance tools
│       ├── pots.ts           # Pot management tools
│       ├── transactions.ts   # Transaction tools
│       ├── feed.ts           # Feed item tools
│       ├── attachments.ts    # Attachment tools
│       ├── receipts.ts       # Receipt tools
│       ├── webhooks.ts       # Webhook tools
│       └── tools.test.ts     # Tool handler tests
├── package.json
├── tsconfig.json
└── README.md
```

**Design decisions:**
- Uses Pattern A (Simple Bearer Token) since Monzo uses personal access tokens
- One file per tool category for clean separation of concerns
- All tool handlers use consistent `logToolCall()` + `try/catch` + `jsonResponse()`/`errorResponse()` pattern
- Amounts are in **pence** (minor units) as per Monzo API convention

## Tools Reference

### Accounts (3 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `monzo_whoami` | Verify authenticated user, returns user ID and auth type | `GET /ping/whoami` |
| `monzo_list_accounts` | List all accounts, optionally filter by type (`uk_retail`, `uk_retail_joint`) | `GET /accounts` |
| `monzo_get_balance` | Get account balance, total balance, currency, and spend today (in pence) | `GET /balance` |

### Pots (3 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `monzo_list_pots` | List all pots for an account | `GET /pots` |
| `monzo_deposit_into_pot` | Move money from account into a pot (amount in pence, requires dedupe_id) | `PUT /pots/{pot_id}/deposit` |
| `monzo_withdraw_from_pot` | Move money from pot back to account (locked pots cannot be withdrawn via API) | `PUT /pots/{pot_id}/withdraw` |

### Transactions (3 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `monzo_list_transactions` | List transactions with optional since/before/limit filters (90-day limit after 5 min) | `GET /transactions` |
| `monzo_get_transaction` | Get single transaction details, optionally expand merchant info | `GET /transactions/{id}` |
| `monzo_annotate_transaction` | Add custom key-value metadata to a transaction | `PATCH /transactions/{id}` |

### Feed (1 tool)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `monzo_create_feed_item` | Create a custom item in the Monzo app feed with title, body, optional image/URL | `POST /feed` |

### Attachments (3 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `monzo_upload_attachment` | Get a pre-signed upload URL for an image | `POST /attachment/upload` |
| `monzo_register_attachment` | Attach an uploaded image to a transaction | `POST /attachment/register` |
| `monzo_deregister_attachment` | Remove an attachment from a transaction | `POST /attachment/deregister` |

### Receipts (3 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `monzo_create_receipt` | Create or update a digital receipt on a transaction | `PUT /transaction-receipts` |
| `monzo_get_receipt` | Get a receipt by external ID | `GET /transaction-receipts` |
| `monzo_delete_receipt` | Delete a receipt | `DELETE /transaction-receipts` |

### Webhooks (3 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `monzo_register_webhook` | Register a URL for real-time transaction notifications | `POST /webhooks` |
| `monzo_list_webhooks` | List all webhooks for an account | `GET /webhooks` |
| `monzo_delete_webhook` | Delete a webhook | `DELETE /webhooks/{id}` |

## Example Prompts

- "What's my Monzo balance?"
- "Show my recent transactions"
- "List my pots"
- "Move 50 pounds into my Holiday pot"
- "What did I spend at Tesco last week?"
- "Send me a notification in Monzo saying 'Remember to buy milk'"
- "Show me my webhooks"
- "Annotate my last transaction with a note"

## Development

### Build

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Watch mode

```bash
npm run test:watch
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

### Adding new tools

1. Create a new file in `src/tools/` or add to an existing category
2. Follow the pattern: `registerXxxTools(server, client)` function
3. Import and call the register function in `src/index.ts`
4. Add tests in `src/tools/tools.test.ts`
5. Update this README

## Troubleshooting

### "Missing required environment variable: MONZO_ACCESS_TOKEN"

Set the `MONZO_ACCESS_TOKEN` in your MCP server config. See [Prerequisites](#prerequisites).

### "Monzo API error (401): unauthorized"

Your access token has expired (tokens last ~6 hours). Get a new one from the [Monzo Playground](https://developers.monzo.com/api/playground).

### "Monzo API error (403): forbidden"

You may need to complete Strong Customer Authentication. Open the Monzo app and check for a pending approval notification.

### Transaction history is empty or limited

After 5 minutes post-authentication, the API only returns the last 90 days of transactions. This is a Monzo security restriction.

### Pots withdrawal fails

Pots with "added security" (locked pots) cannot be withdrawn from via the API. Unlock the pot in the Monzo app first.

### Tools not appearing in Claude

- **Claude Desktop:** Restart the application after updating config
- **Claude Code:** Restart the MCP server or reload settings
- Verify your config uses `"command": "npx"` with `"args": ["-y", "monzo-mcp"]`

## License

MIT
