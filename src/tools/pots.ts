import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall } from "../utils.js";

export function registerPotTools(
  server: McpServer,
  client: MonzoClient
): void {
  server.registerTool(
    "monzo_list_pots",
    {
      title: "List Pots",
      description:
        "List all pots for a Monzo account. Returns pot IDs, names, balances, and styles.",
      inputSchema: {
        current_account_id: z
          .string()
          .describe("The account ID to list pots for"),
      },
    },
    async ({ current_account_id }) => {
      logToolCall("monzo_list_pots", { current_account_id });
      try {
        const result = await client.get("/pots", { current_account_id });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_deposit_into_pot",
    {
      title: "Deposit Into Pot",
      description:
        "Move money from a Monzo account into a pot. Amount is in pence (e.g. 1000 = £10.00). Requires a unique dedupe_id to prevent duplicate deposits.",
      inputSchema: {
        pot_id: z
          .string()
          .describe("The pot ID to deposit into"),
        source_account_id: z
          .string()
          .describe("The account ID to move money from"),
        amount: z
          .number()
          .int()
          .positive()
          .describe("Amount in pence to deposit (e.g. 1000 = £10.00)"),
        dedupe_id: z
          .string()
          .describe("Unique string to prevent duplicate deposits"),
      },
    },
    async ({ pot_id, source_account_id, amount, dedupe_id }) => {
      logToolCall("monzo_deposit_into_pot", { pot_id, amount });
      try {
        const result = await client.putForm(`/pots/${pot_id}/deposit`, {
          source_account_id,
          amount: String(amount),
          dedupe_id,
        });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_withdraw_from_pot",
    {
      title: "Withdraw From Pot",
      description:
        "Move money from a pot back into a Monzo account. Amount is in pence (e.g. 1000 = £10.00). Requires a unique dedupe_id. Pots with added security cannot be withdrawn via API.",
      inputSchema: {
        pot_id: z
          .string()
          .describe("The pot ID to withdraw from"),
        destination_account_id: z
          .string()
          .describe("The account ID to move money to"),
        amount: z
          .number()
          .int()
          .positive()
          .describe("Amount in pence to withdraw (e.g. 1000 = £10.00)"),
        dedupe_id: z
          .string()
          .describe("Unique string to prevent duplicate withdrawals"),
      },
    },
    async ({ pot_id, destination_account_id, amount, dedupe_id }) => {
      logToolCall("monzo_withdraw_from_pot", { pot_id, amount });
      try {
        const result = await client.putForm(`/pots/${pot_id}/withdraw`, {
          destination_account_id,
          amount: String(amount),
          dedupe_id,
        });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
