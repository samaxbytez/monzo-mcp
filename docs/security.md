# Security

This server's threat model is **indirect prompt injection**: text that Monzo
returns (merchant names, transaction notes, references) can be written by third
parties and reach the model as tool output. Monzo is a bank, so the rules below
are about keeping an injected instruction away from your money and your data. The
rules a change must not weaken are in [AGENTS.md](../AGENTS.md#security-conventions-threat-model-indirect-prompt-injection).

## Tools that are off by default

Not registered unless `MONZO_ENABLE_SENSITIVE_TOOLS=true`:

- `monzo_deposit_into_pot`, `monzo_withdraw_from_pot`: move money
- `monzo_register_webhook`: Monzo would POST every future transaction to a URL
  the model chose
- `monzo_create_feed_item`: puts model-chosen text, links and images inside the
  trusted Monzo app, which is a phishing vector

Everything else can read, annotate, and manage receipts and attachments. Every
tool has MCP annotations so clients can ask before writes and deletes.

Turning the flag on is a decision to trust whatever the model reads. Prefer
approving each call in your client rather than auto-approving these tools.

## Requests

- IDs that go into request paths are restricted to letters, digits, `_` and `-`.
- The HTTP client only accepts plain `/path` values (no `..`, encoding, scheme or
  host), then checks the resolved origin and base path.
- Redirects are refused, so the bearer token only goes to the API host.
- Requests time out after 30 seconds. Rate limits report `Retry-After`. Non-JSON
  error bodies are never echoed.
- `MONZO_API_URL` accepts https, or http on loopback only.
- Webhook, feed and attachment URLs must be https.

## Data

- Pre-signed attachment download links are removed from transaction results.
- The token is read from the environment, never written to disk or logged.

## Supply chain

The published package has no runtime dependencies: the server, MCP SDK and zod are
bundled into one file with licences. CI uses SHA-pinned actions and
`npm ci --ignore-scripts`; publishing needs a manual approval and uses npm
provenance.

## Reporting a problem

Open a [private security advisory](https://github.com/samaxbytez/monzo-mcp/security/advisories/new).
