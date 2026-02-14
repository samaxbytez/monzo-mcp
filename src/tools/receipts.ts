import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall } from "../utils.js";

export function registerReceiptTools(
  server: McpServer,
  client: MonzoClient
): void {
  server.registerTool(
    "monzo_create_receipt",
    {
      title: "Create/Update Receipt",
      description:
        "Create or update a receipt on a Monzo transaction. Provide the transaction ID and receipt items as a JSON structure.",
      inputSchema: {
        transaction_id: z
          .string()
          .describe("The transaction ID to attach the receipt to"),
        items: z
          .string()
          .describe("JSON array of receipt items, each with: description (string), amount (integer in pence), currency (string, e.g. 'GBP'), quantity (number). Example: [{\"description\":\"Coffee\",\"amount\":350,\"currency\":\"GBP\",\"quantity\":1}]"),
        tax: z
          .number()
          .int()
          .optional()
          .describe("Total tax amount in pence"),
      },
    },
    async ({ transaction_id, items, tax }) => {
      logToolCall("monzo_create_receipt", { transaction_id });
      try {
        const parsedItems = JSON.parse(items);
        const receiptBody: Record<string, unknown> = {
          transaction_id,
          external_id: transaction_id,
          items: parsedItems,
        };
        if (tax !== undefined) receiptBody.tax = tax;

        const result = await client.putJson("/transaction-receipts", receiptBody);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_get_receipt",
    {
      title: "Get Receipt",
      description:
        "Retrieve a receipt attached to a Monzo transaction.",
      inputSchema: {
        external_id: z
          .string()
          .describe("The external ID (typically the transaction ID) of the receipt"),
      },
    },
    async ({ external_id }) => {
      logToolCall("monzo_get_receipt", { external_id });
      try {
        const result = await client.get("/transaction-receipts", { external_id });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_delete_receipt",
    {
      title: "Delete Receipt",
      description:
        "Delete a receipt from a Monzo transaction.",
      inputSchema: {
        external_id: z
          .string()
          .describe("The external ID (typically the transaction ID) of the receipt to delete"),
      },
    },
    async ({ external_id }) => {
      logToolCall("monzo_delete_receipt", { external_id });
      try {
        const result = await client.deleteReq("/transaction-receipts", { external_id });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
