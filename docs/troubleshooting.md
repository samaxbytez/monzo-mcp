# Troubleshooting

**"Missing required environment variable: MONZO_ACCESS_TOKEN"**
Set `MONZO_ACCESS_TOKEN` in your client's `env` block. See [setup.md](setup.md).

**"Monzo API error (401)"**
The token expired (about 6 hours) or a newer one replaced it. Generate a new one in the [API Playground](https://developers.monzo.com/api/playground).

**"Monzo API error (403)"**
Approve the push notification in the Monzo app (Strong Customer Authentication), then retry.

**Transaction history is empty or short**
Five minutes after approving, the API only returns the last 90 days. Re-authenticate to read more.

**Pot deposit, withdraw, webhook or feed tools are missing**
They need `MONZO_ENABLE_SENSITIVE_TOOLS=true`. See [security.md](security.md).

**Pot withdrawal fails**
Pots with added security can't be withdrawn from via the API. Unlock it in the Monzo app.

**"Refusing request path"**
An ID contained characters other than letters, digits, `_` and `-`. Use the ID exactly as Monzo returned it.

**"Monzo rate limit reached; retry after N seconds"**
Wait the stated time and retry.

**Tools not appearing**
Restart the client after editing its config, and check it runs `npx -y monzo-mcp`.
