import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { runTool, safeId } from "../utils.js";

const amount = (verb: string) =>
  z.number().int().positive().describe(`Amount in pence to ${verb} (e.g. 1000 = £10.00)`);

const dedupeId = z
  .string()
  .min(1)
  .max(100)
  .describe(
    "Unique string to prevent duplicate transfers; reuse it only to retry the same one"
  );

export function registerPotTools(server: McpServer, client: MonzoClient): void {
  server.registerTool(
    "monzo_list_pots",
    {
      title: "List Pots",
      description:
        "List all pots for a Monzo account. Returns pot IDs, names, balances, and styles.",
      inputSchema: {
        current_account_id: safeId("The account ID to list pots for"),
      },
    },
    ({ current_account_id }) =>
      runTool("monzo_list_pots", { current_account_id }, () =>
        client.get("/pots", { current_account_id })
      )
  );

  server.registerTool(
    "monzo_deposit_into_pot",
    {
      title: "Deposit Into Pot",
      description:
        "Move money from a Monzo account into a pot. Amount is in pence (e.g. 1000 = £10.00). Requires a unique dedupe_id to prevent duplicate deposits. Only available when MONZO_ENABLE_SENSITIVE_TOOLS=true.",
      inputSchema: {
        pot_id: safeId("The pot ID to deposit into"),
        source_account_id: safeId("The account ID to move money from"),
        amount: amount("deposit"),
        dedupe_id: dedupeId,
      },
    },
    ({ pot_id, source_account_id, amount, dedupe_id }) =>
      runTool("monzo_deposit_into_pot", { pot_id, amount }, () =>
        client.putForm(`/pots/${pot_id}/deposit`, {
          source_account_id,
          amount: String(amount),
          dedupe_id,
        })
      )
  );

  server.registerTool(
    "monzo_withdraw_from_pot",
    {
      title: "Withdraw From Pot",
      description:
        "Move money from a pot back into a Monzo account. Amount is in pence (e.g. 1000 = £10.00). Requires a unique dedupe_id. Pots with added security cannot be withdrawn via API. Only available when MONZO_ENABLE_SENSITIVE_TOOLS=true.",
      inputSchema: {
        pot_id: safeId("The pot ID to withdraw from"),
        destination_account_id: safeId("The account ID to move money to"),
        amount: amount("withdraw"),
        dedupe_id: dedupeId,
      },
    },
    ({ pot_id, destination_account_id, amount, dedupe_id }) =>
      runTool("monzo_withdraw_from_pot", { pot_id, amount }, () =>
        client.putForm(`/pots/${pot_id}/withdraw`, {
          destination_account_id,
          amount: String(amount),
          dedupe_id,
        })
      )
  );
}
