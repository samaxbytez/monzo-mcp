import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { runTool, safeId } from "../utils.js";

const receiptItem = z.object({
  description: z.string().min(1).max(200).describe("Item description"),
  amount: z.number().int().describe("Item price in pence"),
  currency: z.string().length(3).describe("ISO currency code, e.g. 'GBP'"),
  quantity: z.number().positive().describe("Quantity"),
});

export function registerReceiptTools(server: McpServer, client: MonzoClient): void {
  server.registerTool(
    "monzo_create_receipt",
    {
      title: "Create/Update Receipt",
      description:
        "Create or update (overwrite) a receipt on a Monzo transaction. Provide the transaction ID and the receipt items.",
      inputSchema: {
        transaction_id: safeId("The transaction ID to attach the receipt to"),
        items: z.array(receiptItem).min(1).max(100).describe("Receipt line items"),
        tax: z.number().int().optional().describe("Total tax amount in pence"),
      },
    },
    ({ transaction_id, items, tax }) =>
      runTool("monzo_create_receipt", { transaction_id }, () =>
        client.putJson("/transaction-receipts", {
          transaction_id,
          external_id: transaction_id,
          items,
          ...(tax !== undefined && { tax }),
        })
      )
  );

  server.registerTool(
    "monzo_get_receipt",
    {
      title: "Get Receipt",
      description: "Retrieve a receipt attached to a Monzo transaction.",
      inputSchema: {
        external_id: safeId(
          "The external ID (typically the transaction ID) of the receipt"
        ),
      },
    },
    ({ external_id }) =>
      runTool("monzo_get_receipt", { external_id }, () =>
        client.get("/transaction-receipts", { external_id })
      )
  );

  server.registerTool(
    "monzo_delete_receipt",
    {
      title: "Delete Receipt",
      description: "Delete a receipt from a Monzo transaction.",
      inputSchema: {
        external_id: safeId(
          "The external ID (typically the transaction ID) of the receipt to delete"
        ),
      },
    },
    ({ external_id }) =>
      runTool("monzo_delete_receipt", { external_id }, () =>
        client.deleteReq("/transaction-receipts", { external_id })
      )
  );
}
