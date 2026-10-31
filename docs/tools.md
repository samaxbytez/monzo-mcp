# Tools

19 tools. The 4 marked **opt-in** are only registered when
`MONZO_ENABLE_SENSITIVE_TOOLS=true` ([security.md](security.md)). Amounts are in
pence. Every tool carries MCP annotations (`readOnlyHint`, `destructiveHint`,
`openWorldHint`) so clients can ask before writes and deletes. IDs must be letters,
digits, `_` or `-`.

## Accounts (3 tools)

| Tool | What | Endpoint |
| --- | --- | --- |
| `monzo_whoami` | Verify the authenticated user | `GET /ping/whoami` |
| `monzo_list_accounts` | List accounts, optionally by `account_type` | `GET /accounts` |
| `monzo_get_balance` | Balance, total balance, currency, spend today | `GET /balance` |

## Pots (3 tools)

| Tool | What | Endpoint |
| --- | --- | --- |
| `monzo_list_pots` | List pots for an account | `GET /pots` |
| `monzo_deposit_into_pot` **opt-in** | Move money from an account into a pot (needs `dedupe_id`) | `PUT /pots/{id}/deposit` |
| `monzo_withdraw_from_pot` **opt-in** | Move money from a pot to an account (locked pots refuse) | `PUT /pots/{id}/withdraw` |

## Transactions (3 tools)

| Tool | What | Endpoint |
| --- | --- | --- |
| `monzo_list_transactions` | List with `since`, `before`, `limit` (max 100) | `GET /transactions` |
| `monzo_get_transaction` | One transaction, optionally with merchant | `GET /transactions/{id}` |
| `monzo_annotate_transaction` | Set a metadata key on a transaction | `PATCH /transactions/{id}` |

**Paging:** `monzo_list_transactions` returns `pagination: { returned, has_more, next_since }`.
When `has_more` is true, call again with `since` set to `next_since`. History is
limited to 90 days. Attachment download links are removed from results.

## Feed (1 tool)

| Tool | What | Endpoint |
| --- | --- | --- |
| `monzo_create_feed_item` **opt-in** | Show a title/body (https image and link optional) in the Monzo app | `POST /feed` |

## Attachments (3 tools)

| Tool | What | Endpoint |
| --- | --- | --- |
| `monzo_upload_attachment` | Get a pre-signed upload URL for an image | `POST /attachment/upload` |
| `monzo_register_attachment` | Attach an uploaded image (https `file_url`) to a transaction | `POST /attachment/register` |
| `monzo_deregister_attachment` | Remove an attachment | `POST /attachment/deregister` |

## Receipts (3 tools)

| Tool | What | Endpoint |
| --- | --- | --- |
| `monzo_create_receipt` | Create or overwrite a receipt; `items` is an array of `{description, amount, currency, quantity}` | `PUT /transaction-receipts` |
| `monzo_get_receipt` | Get a receipt by `external_id` | `GET /transaction-receipts` |
| `monzo_delete_receipt` | Delete a receipt | `DELETE /transaction-receipts` |

## Webhooks (3 tools)

| Tool | What | Endpoint |
| --- | --- | --- |
| `monzo_register_webhook` **opt-in** | Monzo POSTs each new transaction to an https URL | `POST /webhooks` |
| `monzo_list_webhooks` | List webhooks | `GET /webhooks` |
| `monzo_delete_webhook` | Delete a webhook | `DELETE /webhooks/{id}` |

## Example prompts

- "What's my Monzo balance?"
- "Show my transactions since Monday"
- "List my pots"
- "Annotate my last transaction with a note"
- "Show me my webhooks"
- With the opt-in on: "Move £50 into my Holiday pot"
