# Monzo MCP Server

An MCP (Model Context Protocol) server for the [Monzo banking API](https://docs.monzo.com). Check your balance, list transactions, manage pots, and more — all through natural language.

Works with any MCP-compatible client, including Claude Desktop, Claude Code, Cursor, Windsurf, Cline, and others.

> **Note:** The Monzo Developer API is for personal use only. You can only connect to your own account or a small number of explicitly allowed users.

## Features

19 tools covering the full Monzo API:

| Category | Tools | Description |
|----------|-------|-------------|
| **Accounts** | `monzo_whoami`, `monzo_list_accounts`, `monzo_get_balance` | View account info and balances |
| **Pots** | `monzo_list_pots`, `monzo_deposit_into_pot`, `monzo_withdraw_from_pot` | Manage savings pots |
| **Transactions** | `monzo_list_transactions`, `monzo_get_transaction`, `monzo_annotate_transaction` | Browse and annotate transactions |
| **Feed** | `monzo_create_feed_item` | Push custom items to the Monzo app feed |
| **Attachments** | `monzo_upload_attachment`, `monzo_register_attachment`, `monzo_deregister_attachment` | Attach images to transactions |
| **Receipts** | `monzo_create_receipt`, `monzo_get_receipt`, `monzo_delete_receipt` | Manage digital receipts |
| **Webhooks** | `monzo_register_webhook`, `monzo_list_webhooks`, `monzo_delete_webhook` | Set up real-time notifications |

---

## Getting Your Monzo Access Token

You need an access token to use this server. Follow these steps:

### Step 1: Create a Monzo Developer Account

1. Go to [developers.monzo.com](https://developers.monzo.com)
2. Log in with your Monzo email address
3. You'll receive a magic link in your email — click it to sign in

### Step 2: Create an OAuth Client

1. Once logged in, go to **Clients** and click **New OAuth Client**
2. Fill in the details:
   - **Name**: Something like "MCP Server" (this is just for your reference)
   - **Logo URL**: Can be left blank
   - **Redirect URLs**: Enter `http://localhost:8374/callback` (or any URL — you'll use the Playground instead)
   - **Description**: Optional
   - **Confidentiality**: Select **Confidential** (this gives you refresh tokens)
3. Click **Submit** and note down your **Client ID** and **Client Secret**

### Step 3: Get an Access Token via the API Playground

The fastest way to get a token:

1. Go to [developers.monzo.com/api/playground](https://developers.monzo.com/api/playground)
2. Click **Auth** to start the authentication flow
3. You'll receive a **push notification** on your Monzo app — tap it and verify with your PIN, fingerprint, or Face ID (Strong Customer Authentication)
4. Once approved, the Playground will show your **Access Token**
5. Copy this token — you'll need it in the next section

### Step 4: (Alternative) Get a Token via OAuth Flow

If the Playground doesn't work, use the full OAuth flow:

1. Open this URL in your browser (replace `YOUR_CLIENT_ID`):
   ```
   https://auth.monzo.com/?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:8374/callback&response_type=code&state=random123
   ```
2. Log in with your email, then approve in the Monzo app
3. You'll be redirected to `http://localhost:8374/callback?code=AUTH_CODE&state=random123`
4. Copy the `code` value from the URL
5. Exchange it for an access token:
   ```bash
   curl -X POST "https://api.monzo.com/oauth2/token" \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:8374/callback" \
     -d "code=AUTH_CODE"
   ```
6. The response contains your `access_token`

### Important Notes About Tokens

- **Tokens expire** after approximately **6 hours**
- After authentication, you have **5 minutes** of full transaction history access. After that, only the **last 90 days** are available
- Generating a new token **invalidates** the previous one
- If your token expires, you'll need to repeat Step 3 or Step 4

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later

### Build from Source

```bash
git clone <repo-url>
cd monzo-mcp-server
npm install
npm run build
```

---

## Configuration

### Claude Desktop

Add the following to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "monzo": {
      "command": "node",
      "args": ["/absolute/path/to/monzo-mcp-server/build/index.js"],
      "env": {
        "MONZO_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

Then restart Claude Desktop.

### Claude Code (CLI)

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "monzo": {
      "command": "node",
      "args": ["/absolute/path/to/monzo-mcp-server/build/index.js"],
      "env": {
        "MONZO_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

### Other MCP Clients (Cursor, Windsurf, Cline, etc.)

Refer to your client's documentation for how to add an MCP server. The server command is:

```
node /absolute/path/to/monzo-mcp-server/build/index.js
```

With the environment variable `MONZO_ACCESS_TOKEN` set to your token.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONZO_ACCESS_TOKEN` | Yes | Your Monzo API access token |

---

## Usage Examples

Once configured, you can ask your AI assistant things like (using Claude as an example):

- **"What's my Monzo balance?"** — calls `monzo_get_balance`
- **"Show my recent transactions"** — calls `monzo_list_transactions`
- **"List my pots"** — calls `monzo_list_pots`
- **"Move £50 into my Holiday pot"** — calls `monzo_deposit_into_pot`
- **"What did I spend at Tesco last week?"** — calls `monzo_list_transactions` with filters
- **"Send me a notification in Monzo saying 'Remember to buy milk'"** — calls `monzo_create_feed_item`

---

## Tool Reference

### Accounts

#### `monzo_whoami`
Verify the authenticated user. Returns user ID, authentication type, and client ID.

#### `monzo_list_accounts`
List all accounts. Optionally filter by `account_type` (`uk_retail`, `uk_retail_joint`).

#### `monzo_get_balance`
Get the balance for a specific account. Returns balance, total balance, currency, and spend today — all in **pence** (minor units).

**Parameters:**
- `account_id` (required) — The account ID

---

### Pots

#### `monzo_list_pots`
List all pots for an account.

**Parameters:**
- `current_account_id` (required) — The account ID

#### `monzo_deposit_into_pot`
Move money from your account into a pot.

**Parameters:**
- `pot_id` (required) — The pot to deposit into
- `source_account_id` (required) — The account to move money from
- `amount` (required) — Amount in **pence** (e.g. `1000` = £10.00)
- `dedupe_id` (required) — A unique string to prevent duplicate deposits

#### `monzo_withdraw_from_pot`
Move money from a pot back into your account. Pots with "added security" (lock) cannot be withdrawn via API.

**Parameters:**
- `pot_id` (required) — The pot to withdraw from
- `destination_account_id` (required) — The account to move money to
- `amount` (required) — Amount in **pence**
- `dedupe_id` (required) — A unique string to prevent duplicate withdrawals

---

### Transactions

#### `monzo_list_transactions`
List transactions for an account. Limited to the last 90 days (after 5 minutes post-authentication).

**Parameters:**
- `account_id` (required) — The account ID
- `since` (optional) — RFC 3339 timestamp or object ID (e.g. `2024-01-01T00:00:00Z`)
- `before` (optional) — RFC 3339 timestamp
- `limit` (optional) — Results per page (default 30, max 100)

#### `monzo_get_transaction`
Get details of a single transaction.

**Parameters:**
- `transaction_id` (required) — The transaction ID
- `expand_merchant` (optional) — Set to `true` to include full merchant details

#### `monzo_annotate_transaction`
Add custom key-value metadata to a transaction.

**Parameters:**
- `transaction_id` (required) — The transaction ID
- `key` (required) — The metadata key
- `value` (required) — The metadata value (empty string to delete)

---

### Feed

#### `monzo_create_feed_item`
Create a custom item in the Monzo app feed.

**Parameters:**
- `account_id` (required) — The account ID
- `title` (required) — Feed item title
- `body` (required) — Feed item body text
- `image_url` (optional) — URL of an image to display
- `url` (optional) — URL to open when tapped

---

### Attachments

#### `monzo_upload_attachment`
Get a pre-signed upload URL for an image.

**Parameters:**
- `file_name` (required) — e.g. `receipt.png`
- `file_type` (required) — MIME type, e.g. `image/png`
- `content_length` (required) — File size in bytes

#### `monzo_register_attachment`
Attach an uploaded image to a transaction.

**Parameters:**
- `external_id` (required) — The transaction ID
- `file_url` (required) — The URL from `monzo_upload_attachment`
- `file_type` (required) — MIME type

#### `monzo_deregister_attachment`
Remove an attachment from a transaction.

**Parameters:**
- `id` (required) — The attachment ID

---

### Receipts

#### `monzo_create_receipt`
Create or update a digital receipt on a transaction.

**Parameters:**
- `transaction_id` (required) — The transaction ID
- `items` (required) — JSON array of receipt items (each with `description`, `amount` in pence, `currency`, `quantity`)
- `tax` (optional) — Total tax in pence

#### `monzo_get_receipt`
Get a receipt by its external ID.

**Parameters:**
- `external_id` (required) — Typically the transaction ID

#### `monzo_delete_receipt`
Delete a receipt.

**Parameters:**
- `external_id` (required) — Typically the transaction ID

---

### Webhooks

#### `monzo_register_webhook`
Register a URL to receive real-time transaction notifications.

**Parameters:**
- `account_id` (required) — The account ID
- `url` (required) — The webhook URL

#### `monzo_list_webhooks`
List all webhooks for an account.

**Parameters:**
- `account_id` (required) — The account ID

#### `monzo_delete_webhook`
Delete a webhook.

**Parameters:**
- `webhook_id` (required) — The webhook ID

---

## Troubleshooting

### "Missing required environment variable: MONZO_ACCESS_TOKEN"
You haven't set the `MONZO_ACCESS_TOKEN` in your MCP server config. See [Getting Your Monzo Access Token](#getting-your-monzo-access-token).

### "Monzo API error (401): unauthorized"
Your access token has expired (tokens last ~6 hours). Get a new one from the [Monzo Playground](https://developers.monzo.com/api/playground).

### "Monzo API error (403): forbidden"
You may need to complete Strong Customer Authentication. Open the Monzo app and check for a pending approval notification.

### "Transaction history is empty or limited"
After 5 minutes post-authentication, the API only returns the last 90 days of transactions. This is a Monzo security restriction.

### Pots withdrawal fails
Pots with "added security" (locked pots) cannot be withdrawn from via the API. Unlock the pot in the Monzo app first.

---

## License

MIT
