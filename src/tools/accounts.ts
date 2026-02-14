import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall, buildParams } from "../utils.js";

export function registerAccountTools(
  server: McpServer,
  client: MonzoClient
): void {
  server.registerTool(
    "monzo_whoami",
    {
      title: "Who Am I",
      description:
        "Verify the authenticated Monzo user. Returns user ID, authentication type, and client ID.",
    },
    async () => {
      logToolCall("monzo_whoami");
      try {
        const result = await client.get("/ping/whoami");
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_list_accounts",
    {
      title: "List Accounts",
      description:
        "List the authenticated user's Monzo accounts. Returns account IDs, types, and descriptions.",
      inputSchema: {
        account_type: z
          .string()
          .optional()
          .describe("Filter by account type (e.g. 'uk_retail', 'uk_retail_joint')"),
      },
    },
    async ({ account_type }) => {
      logToolCall("monzo_list_accounts", { account_type });
      try {
        const params = buildParams({ account_type });
        const result = await client.get("/accounts", params);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_get_balance",
    {
      title: "Get Balance",
      description:
        "Fetch the balance of a Monzo account. Returns balance, total balance, currency, and spend today (all in minor units / pence).",
      inputSchema: {
        account_id: z
          .string()
          .describe("The account ID to get the balance for"),
      },
    },
    async ({ account_id }) => {
      logToolCall("monzo_get_balance", { account_id });
      try {
        const result = await client.get("/balance", { account_id });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
