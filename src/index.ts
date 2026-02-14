#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MonzoClient } from "./client.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerPotTools } from "./tools/pots.js";
import { registerTransactionTools } from "./tools/transactions.js";
import { registerFeedTools } from "./tools/feed.js";
import { registerAttachmentTools } from "./tools/attachments.js";
import { registerReceiptTools } from "./tools/receipts.js";
import { registerWebhookTools } from "./tools/webhooks.js";

const MONZO_ACCESS_TOKEN = process.env.MONZO_ACCESS_TOKEN;

if (!MONZO_ACCESS_TOKEN) {
  console.error(
    "Missing required environment variable: MONZO_ACCESS_TOKEN"
  );
  process.exit(1);
}

const monzoClient = new MonzoClient(MONZO_ACCESS_TOKEN);

const server = new McpServer({
  name: "monzo-api",
  version: "1.0.0",
});

registerAccountTools(server, monzoClient);
registerPotTools(server, monzoClient);
registerTransactionTools(server, monzoClient);
registerFeedTools(server, monzoClient);
registerAttachmentTools(server, monzoClient);
registerReceiptTools(server, monzoClient);
registerWebhookTools(server, monzoClient);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Monzo MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
