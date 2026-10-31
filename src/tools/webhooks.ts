import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { runTool, safeId } from "../utils.js";

export function registerWebhookTools(server: McpServer, client: MonzoClient): void {
  server.registerTool(
    "monzo_register_webhook",
    {
      title: "Register Webhook",
      description:
        "Register a webhook URL to receive real-time notifications for a Monzo account. Each time a transaction is created, Monzo will POST the transaction data to the URL. Only available when MONZO_ENABLE_SENSITIVE_TOOLS=true.",
      inputSchema: {
        account_id: safeId("The account ID to register the webhook for"),
        url: z
          .url({ protocol: /^https$/ })
          .describe("The https URL that Monzo will POST transaction events to"),
      },
    },
    ({ account_id, url }) =>
      runTool("monzo_register_webhook", { account_id, url }, () =>
        client.postForm("/webhooks", { account_id, url })
      )
  );

  server.registerTool(
    "monzo_list_webhooks",
    {
      title: "List Webhooks",
      description: "List all registered webhooks for a Monzo account.",
      inputSchema: {
        account_id: safeId("The account ID to list webhooks for"),
      },
    },
    ({ account_id }) =>
      runTool("monzo_list_webhooks", { account_id }, () =>
        client.get("/webhooks", { account_id })
      )
  );

  server.registerTool(
    "monzo_delete_webhook",
    {
      title: "Delete Webhook",
      description: "Delete a registered webhook by its ID.",
      inputSchema: {
        webhook_id: safeId("The webhook ID to delete"),
      },
    },
    ({ webhook_id }) =>
      runTool("monzo_delete_webhook", { webhook_id }, () =>
        client.deleteReq(`/webhooks/${webhook_id}`)
      )
  );
}
