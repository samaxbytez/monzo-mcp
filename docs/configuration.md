# Configuration

## Environment variables

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `MONZO_ACCESS_TOKEN` | Yes | | Monzo API access token (about 6 hours). The server exits at startup without it. |
| `MONZO_ENABLE_SENSITIVE_TOOLS` | No | off | Exactly `true` registers `monzo_deposit_into_pot`, `monzo_withdraw_from_pot`, `monzo_register_webhook` and `monzo_create_feed_item`. See [security.md](security.md). |
| `MONZO_API_URL` | No | `https://api.monzo.com` | API base URL. Must be https, or http on `localhost`/`127.0.0.1`. For testing against a fake API. |

## MCP clients

Every client runs the same command, `npx -y monzo-mcp`, with the token in `env`.
Prefer a user-level config file over a project one, so the token is never committed.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`, then restart:

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

### Claude Code

Add the same block to `.mcp.json`, or run
`claude mcp add monzo -e MONZO_ACCESS_TOKEN=... -- npx -y monzo-mcp`.

### Codex CLI

`~/.codex/config.toml`:

```toml
[mcp_servers.monzo]
command = "npx"
args = ["-y", "monzo-mcp"]
env = { MONZO_ACCESS_TOKEN = "your_access_token_here" }
```

### Cursor

The same `mcpServers` block in `~/.cursor/mcp.json` (all projects) or
`.cursor/mcp.json` (one project).

### Windsurf

The same `mcpServers` block in `~/.codeium/windsurf/mcp_config.json`.

### Gemini CLI

The same `mcpServers` block in `~/.gemini/settings.json`, alongside existing settings.

### VS Code (GitHub Copilot agent mode)

`.vscode/mcp.json`. VS Code uses `servers` and can prompt for the token instead of
storing it:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "monzo-token",
      "description": "Monzo access token",
      "password": true
    }
  ],
  "servers": {
    "monzo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "monzo-mcp"],
      "env": { "MONZO_ACCESS_TOKEN": "${input:monzo-token}" }
    }
  }
}
```

### ChatGPT and Grok

Not supported yet. This server runs on your computer and talks to its client over
stdio; ChatGPT's connectors and xAI's Grok only connect to MCP servers hosted on
the internet over HTTPS.
