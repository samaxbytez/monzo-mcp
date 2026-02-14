import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall, buildParams } from "../utils.js";

export function registerTransactionTools(
  server: McpServer,
  client: MonzoClient
): void {
  server.registerTool(
    "monzo_list_transactions",
    {
      title: "List Transactions",
      description:
        "List transactions for a Monzo account. Returns transaction amounts, merchants, categories, and metadata. Note: transaction history is limited to 90 days for API access.",
      inputSchema: {
        account_id: z
          .string()
          .describe("The account ID to list transactions for"),
        since: z
          .string()
          .optional()
          .describe("RFC 3339 timestamp or object ID to filter transactions after (e.g. '2024-01-01T00:00:00Z')"),
        before: z
          .string()
          .optional()
          .describe("RFC 3339 timestamp to filter transactions before"),
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe("Number of results per page (default 30, max 100)"),
      },
    },
    async ({ account_id, since, before, limit }) => {
      logToolCall("monzo_list_transactions", { account_id, since, before, limit });
      try {
        const params = buildParams({ account_id, since, before, limit });
        const result = await client.get("/transactions", params);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_get_transaction",
    {
      title: "Get Transaction",
      description:
        "Retrieve details of a single Monzo transaction by its ID. Optionally expand merchant details.",
      inputSchema: {
        transaction_id: z
          .string()
          .describe("The transaction ID to look up"),
        expand_merchant: z
          .boolean()
          .optional()
          .describe("Set to true to include full merchant details"),
      },
    },
    async ({ transaction_id, expand_merchant }) => {
      logToolCall("monzo_get_transaction", { transaction_id });
      try {
        const params: Record<string, string> = {};
        if (expand_merchant) {
          params["expand[]"] = "merchant";
        }
        const result = await client.get(`/transactions/${transaction_id}`, params);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_annotate_transaction",
    {
      title: "Annotate Transaction",
      description:
        "Add custom metadata/annotations to a Monzo transaction. You can store key-value pairs on the transaction.",
      inputSchema: {
        transaction_id: z
          .string()
          .describe("The transaction ID to annotate"),
        key: z
          .string()
          .describe("The metadata key (will be stored as metadata[key])"),
        value: z
          .string()
          .describe("The metadata value. Set to empty string to delete the key."),
      },
    },
    async ({ transaction_id, key, value }) => {
      logToolCall("monzo_annotate_transaction", { transaction_id, key });
      try {
        const result = await client.patchForm(`/transactions/${transaction_id}`, {
          [`metadata[${key}]`]: value,
        });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
