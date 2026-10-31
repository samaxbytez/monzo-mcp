import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

// Tools that move money, or send account data or content to somewhere outside
// the account. Text Monzo returns (merchant names, notes, references) can be
// written by third parties, so an injected instruction must not be able to
// reach these unless the user has opted in with MONZO_ENABLE_SENSITIVE_TOOLS.
export const SENSITIVE_TOOLS = new Set([
  "monzo_deposit_into_pot",
  "monzo_withdraw_from_pot",
  // Monzo POSTs every future transaction to the URL.
  "monzo_register_webhook",
  // Shows attacker-chosen text, links and images inside the trusted Monzo app.
  "monzo_create_feed_item",
]);

export function annotationsFor(name: string): ToolAnnotations {
  const action = name.replace(/^monzo_/, "").split("_")[0];

  if (action === "list" || action === "get" || action === "whoami") {
    return { readOnlyHint: true, openWorldHint: false };
  }
  if (name === "monzo_register_webhook" || name === "monzo_create_feed_item") {
    return { readOnlyHint: false, destructiveHint: false, openWorldHint: true };
  }
  if (name === "monzo_register_attachment") {
    // Monzo fetches file_url from the internet.
    return { readOnlyHint: false, destructiveHint: false, openWorldHint: true };
  }
  if (
    action === "delete" ||
    action === "deregister" ||
    action === "withdraw" ||
    action === "deposit" ||
    action === "annotate" ||
    name === "monzo_create_receipt" // create-or-overwrite
  ) {
    return { readOnlyHint: false, destructiveHint: true, openWorldHint: false };
  }
  return { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
}

/**
 * Wraps the server so every tool registered through it gets MCP annotations,
 * and sensitive tools are dropped unless `allowSensitive` is set.
 */
export function withToolPolicy(
  server: McpServer,
  options: { allowSensitive: boolean }
): McpServer {
  return new Proxy(server, {
    get(target, prop, receiver) {
      if (prop === "registerTool") {
        const original = Reflect.get(target, prop, receiver) as (
          ...args: unknown[]
        ) => RegisteredTool;
        return (...args: unknown[]) => {
          const name = args[0] as string;
          const registered = original.apply(target, args);
          if (SENSITIVE_TOOLS.has(name) && !options.allowSensitive) {
            registered.remove();
          } else {
            registered.update({ annotations: annotationsFor(name) });
          }
          return registered;
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
