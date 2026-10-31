import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { runTool, safeId, definedOnly } from "../utils.js";

export function registerAccountTools(server: McpServer, client: MonzoClient): void {
  server.registerTool(
    "monzo_whoami",
    {
      title: "Who Am I",
      description:
        "Verify the authenticated Monzo user. Returns user ID, authentication type, and client ID.",
    },
    () => runTool("monzo_whoami", undefined, () => client.get("/ping/whoami"))
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
          .max(50)
          .optional()
          .describe("Filter by account type (e.g. 'uk_retail', 'uk_retail_joint')"),
      },
    },
    ({ account_type }) =>
      runTool("monzo_list_accounts", { account_type }, () =>
        client.get("/accounts", definedOnly({ account_type }))
      )
  );

  server.registerTool(
    "monzo_get_balance",
    {
      title: "Get Balance",
      description:
        "Fetch the balance of a Monzo account. Returns balance, total balance, currency, and spend today (all in minor units / pence).",
      inputSchema: {
        account_id: safeId("The account ID to get the balance for"),
      },
    },
    ({ account_id }) =>
      runTool("monzo_get_balance", { account_id }, () =>
        client.get("/balance", { account_id })
      )
  );
}
