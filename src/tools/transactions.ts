import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { runTool, safeId, definedOnly, stripAttachmentLinks } from "../utils.js";

const DEFAULT_LIMIT = 30;

export function registerTransactionTools(server: McpServer, client: MonzoClient): void {
  server.registerTool(
    "monzo_list_transactions",
    {
      title: "List Transactions",
      description:
        "List transactions for a Monzo account, oldest first. Returns amounts, merchants, categories, and metadata, plus a pagination object: when has_more is true, call again with since set to next_since to get the next page. Transaction history is limited to 90 days for API access.",
      inputSchema: {
        account_id: safeId("The account ID to list transactions for"),
        since: z
          .string()
          .max(100)
          .optional()
          .describe(
            "RFC 3339 timestamp or transaction ID to list transactions after (e.g. '2024-01-01T00:00:00Z')"
          ),
        before: z
          .string()
          .max(100)
          .optional()
          .describe("RFC 3339 timestamp to filter transactions before"),
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe(`Number of results per page (default ${DEFAULT_LIMIT}, max 100)`),
      },
    },
    ({ account_id, since, before, limit }) =>
      runTool(
        "monzo_list_transactions",
        { account_id, since, before, limit },
        async () => {
          const result = await client.get<{ transactions?: { id: string }[] }>(
            "/transactions",
            definedOnly({ account_id, since, before, limit })
          );
          const transactions = result.transactions ?? [];
          // Monzo has no cursor: a full page means there may be more, and the
          // last ID is the "since" for the next one.
          const hasMore = transactions.length >= (limit ?? DEFAULT_LIMIT);
          return stripAttachmentLinks({
            ...result,
            pagination: {
              returned: transactions.length,
              has_more: hasMore,
              ...(hasMore && { next_since: transactions[transactions.length - 1].id }),
            },
          });
        }
      )
  );

  server.registerTool(
    "monzo_get_transaction",
    {
      title: "Get Transaction",
      description:
        "Retrieve details of a single Monzo transaction by its ID. Optionally expand merchant details.",
      inputSchema: {
        transaction_id: safeId("The transaction ID to look up"),
        expand_merchant: z
          .boolean()
          .optional()
          .describe("Set to true to include full merchant details"),
      },
    },
    ({ transaction_id, expand_merchant }) =>
      runTool("monzo_get_transaction", { transaction_id }, async () =>
        stripAttachmentLinks(
          await client.get(
            `/transactions/${transaction_id}`,
            expand_merchant ? { "expand[]": "merchant" } : undefined
          )
        )
      )
  );

  server.registerTool(
    "monzo_annotate_transaction",
    {
      title: "Annotate Transaction",
      description:
        "Add custom metadata/annotations to a Monzo transaction. You can store key-value pairs on the transaction.",
      inputSchema: {
        transaction_id: safeId("The transaction ID to annotate"),
        key: z
          .string()
          .regex(
            /^[a-zA-Z0-9_.-]+$/,
            "must contain only letters, digits, '_', '.' and '-'"
          )
          .max(100)
          .describe("The metadata key (will be stored as metadata[key])"),
        value: z
          .string()
          .max(1000)
          .describe("The metadata value. Set to empty string to delete the key."),
      },
    },
    ({ transaction_id, key, value }) =>
      runTool("monzo_annotate_transaction", { transaction_id, key }, () =>
        client.patchForm(`/transactions/${transaction_id}`, {
          [`metadata[${key}]`]: value,
        })
      )
  );
}
