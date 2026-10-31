#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MonzoClient } from "./client.js";
import { withToolPolicy } from "./policy.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerPotTools } from "./tools/pots.js";
import { registerTransactionTools } from "./tools/transactions.js";
import { registerFeedTools } from "./tools/feed.js";
import { registerAttachmentTools } from "./tools/attachments.js";
import { registerReceiptTools } from "./tools/receipts.js";
import { registerWebhookTools } from "./tools/webhooks.js";

// Inlined from package.json by scripts/bundle.mjs.
declare const PACKAGE_VERSION: string;

const MONZO_ACCESS_TOKEN = process.env.MONZO_ACCESS_TOKEN;

if (!MONZO_ACCESS_TOKEN) {
  console.error("Missing required environment variable: MONZO_ACCESS_TOKEN");
  process.exit(1);
}

const monzoClient = new MonzoClient(MONZO_ACCESS_TOKEN, process.env.MONZO_API_URL);

const server = new McpServer({ name: "monzo-api", version: PACKAGE_VERSION });
const tools = withToolPolicy(server, {
  allowSensitive: process.env.MONZO_ENABLE_SENSITIVE_TOOLS === "true",
});

registerAccountTools(tools, monzoClient);
registerPotTools(tools, monzoClient);
registerTransactionTools(tools, monzoClient);
registerFeedTools(tools, monzoClient);
registerAttachmentTools(tools, monzoClient);
registerReceiptTools(tools, monzoClient);
registerWebhookTools(tools, monzoClient);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Monzo MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
