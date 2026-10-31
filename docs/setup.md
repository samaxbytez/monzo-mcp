# Setting it up

From nothing to asking Claude about your Monzo account, in about five minutes. You
need Node.js 24 or later and a Monzo account.

## 1. Get an access token

1. Go to [developers.monzo.com](https://developers.monzo.com) and log in with your
   Monzo email.
2. Open the [API Playground](https://developers.monzo.com/api/playground) and
   click **Auth**.
3. Approve the **push notification** in the Monzo app (PIN, fingerprint or Face ID).
4. Copy the **Access Token** the Playground shows.

Things to know:

- The token expires after about **6 hours**; generate a new one when it does.
- Generating a new token **invalidates** the previous one.
- For 5 minutes after approving, you can read your full history; after that only
  the **last 90 days** are available.
- Treat the token like a password. Don't commit it or paste it into a chat.

## 2. Add it to your AI app

Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)
and Claude Code (`.mcp.json`):

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

Restart the client. For Codex CLI, Cursor, VS Code, Windsurf and Gemini CLI see
[configuration.md](configuration.md#mcp-clients).

## 3. Check it works

Ask "What's my Monzo balance?" or "Who am I on Monzo?". If a tool errors, see
[troubleshooting.md](troubleshooting.md).

## Moving money

Out of the box the server can only **read** your account, annotate transactions,
and manage receipts and attachments. Depositing into or withdrawing from pots,
registering webhooks and creating feed items need
`MONZO_ENABLE_SENSITIVE_TOOLS=true` in the `env` block. Read
[security.md](security.md) before turning that on.
