import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall } from "../utils.js";

export function registerWebhookTools(
  server: McpServer,
  client: MonzoClient
): void {
  server.registerTool(
    "monzo_register_webhook",
    {
      title: "Register Webhook",
      description:
        "Register a webhook URL to receive real-time notifications for a Monzo account. Each time a transaction is created, Monzo will POST the transaction data to the URL.",
      inputSchema: {
        account_id: z
          .string()
          .describe("The account ID to register the webhook for"),
        url: z
          .string()
          .describe("The URL that Monzo will POST transaction events to"),
      },
    },
    async ({ account_id, url }) => {
      logToolCall("monzo_register_webhook", { account_id, url });
      try {
        const result = await client.postForm("/webhooks", { account_id, url });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_list_webhooks",
    {
      title: "List Webhooks",
      description:
        "List all registered webhooks for a Monzo account.",
      inputSchema: {
        account_id: z
          .string()
          .describe("The account ID to list webhooks for"),
      },
    },
    async ({ account_id }) => {
      logToolCall("monzo_list_webhooks", { account_id });
      try {
        const result = await client.get("/webhooks", { account_id });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_delete_webhook",
    {
      title: "Delete Webhook",
      description:
        "Delete a registered webhook by its ID.",
      inputSchema: {
        webhook_id: z
          .string()
          .describe("The webhook ID to delete"),
      },
    },
    async ({ webhook_id }) => {
      logToolCall("monzo_delete_webhook", { webhook_id });
      try {
        const result = await client.deleteReq(`/webhooks/${webhook_id}`);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
