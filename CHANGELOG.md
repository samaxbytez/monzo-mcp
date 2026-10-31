# Changelog

All notable changes to this project are documented here, in the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) style. Releases are
written by `/release` (see [RELEASING.md](RELEASING.md)).

## [2.0.0] - 2026-10-31

### Breaking

- Money-moving and data-exporting tools are off by default: `monzo_deposit_into_pot`, `monzo_withdraw_from_pot`, `monzo_register_webhook` and `monzo_create_feed_item`. Set `MONZO_ENABLE_SENSITIVE_TOOLS=true` to expose them.
- Node.js 24 or later is required.
- `monzo_create_receipt` takes `items` as a structured array.
- `monzo_list_transactions` returns a `pagination` object (`returned`, `has_more`, `next_since`).
- Responses are compact JSON, and attachment `url` fields are no longer returned.

### Security

- IDs in request paths are validated; the HTTP client rejects traversal, encoded dots, absolute and scheme-relative URLs, and checks the resolved origin.
- Redirects are refused, requests time out after 30 seconds, and non-JSON error bodies are not echoed.
- `MONZO_API_URL` must be https, or http on loopback only.
- All tools carry read-only / destructive annotations; user-supplied URLs must be https.
- Published as one bundled file with no runtime dependencies, plus `THIRD_PARTY_LICENSES.txt`.
- CI and publishing hardened: SHA-pinned actions, `npm ci --ignore-scripts`, gated `npm-publish` environment, Dependabot with a 7-day cooldown.

### Added

- Rate-limit (429) errors report `Retry-After`.
- Smoke test of the built bundle, and a docs set under `docs/`.

### Fixed

- Tool errors no longer leak raw upstream response bodies.

[2.0.0]: https://github.com/samaxbytez/monzo-mcp/releases/tag/v2.0.0
