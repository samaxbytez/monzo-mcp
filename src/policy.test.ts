import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SENSITIVE_TOOLS, annotationsFor, withToolPolicy } from "./policy.js";
import type { MonzoClient } from "./client.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerPotTools } from "./tools/pots.js";
import { registerTransactionTools } from "./tools/transactions.js";
import { registerFeedTools } from "./tools/feed.js";
import { registerAttachmentTools } from "./tools/attachments.js";
import { registerReceiptTools } from "./tools/receipts.js";
import { registerWebhookTools } from "./tools/webhooks.js";

const client = {} as MonzoClient;

function registerAll(allowSensitive: boolean) {
  const server = new McpServer({ name: "t", version: "0" });
  const tools = withToolPolicy(server, { allowSensitive });
  for (const register of [
    registerAccountTools,
    registerPotTools,
    registerTransactionTools,
    registerFeedTools,
    registerAttachmentTools,
    registerReceiptTools,
    registerWebhookTools,
  ]) {
    register(tools, client);
  }
  return (server as any)._registeredTools as Record<
    string,
    { enabled: boolean; annotations?: Record<string, boolean>; inputSchema?: unknown }
  >;
}

describe("tool policy", () => {
  it("hides sensitive tools by default", () => {
    const names = Object.keys(registerAll(false));
    expect(names).toHaveLength(15);
    for (const name of SENSITIVE_TOOLS) expect(names).not.toContain(name);
  });

  it("registers sensitive tools when opted in", () => {
    const names = Object.keys(registerAll(true));
    expect(names).toHaveLength(19);
    for (const name of SENSITIVE_TOOLS) expect(names).toContain(name);
  });

  it("every sensitive tool name matches a real tool", () => {
    const names = Object.keys(registerAll(true));
    for (const name of SENSITIVE_TOOLS) expect(names).toContain(name);
  });

  it("annotates every tool", () => {
    for (const [name, tool] of Object.entries(registerAll(true))) {
      expect(tool.annotations, name).toBeDefined();
    }
  });

  it("marks reads read-only and writes not", () => {
    const tools = registerAll(true);
    for (const [name, tool] of Object.entries(tools)) {
      const isRead = /^monzo_(list|get|whoami)/.test(name);
      expect(tool.annotations?.readOnlyHint, name).toBe(isRead);
    }
  });

  it("flags money movement and deletes as destructive, outbound sends as open-world", () => {
    expect(annotationsFor("monzo_withdraw_from_pot").destructiveHint).toBe(true);
    expect(annotationsFor("monzo_deposit_into_pot").destructiveHint).toBe(true);
    expect(annotationsFor("monzo_delete_webhook").destructiveHint).toBe(true);
    expect(annotationsFor("monzo_register_webhook").openWorldHint).toBe(true);
    expect(annotationsFor("monzo_create_feed_item").openWorldHint).toBe(true);
    expect(annotationsFor("monzo_get_balance").openWorldHint).toBe(false);
  });
});

describe("path-ID safety", () => {
  const PAYLOADS = [
    "../x",
    "%2e%2e/x",
    "1?x",
    "1#x",
    "a/b",
    "a\r\nb",
    "",
    "a b",
    "\u0000",
  ];
  // Arguments that are interpolated into a request path.
  const PATH_ARGS: Record<string, string[]> = {
    monzo_deposit_into_pot: ["pot_id"],
    monzo_withdraw_from_pot: ["pot_id"],
    monzo_get_transaction: ["transaction_id"],
    monzo_annotate_transaction: ["transaction_id"],
    monzo_delete_webhook: ["webhook_id"],
  };

  it("rejects traversal payloads in every path argument", () => {
    const tools = registerAll(true);
    for (const [tool, args] of Object.entries(PATH_ARGS)) {
      const shape =
        (tools[tool].inputSchema as any)?.def?.shape ??
        (tools[tool].inputSchema as any)?.shape;
      for (const arg of args) {
        for (const payload of PAYLOADS) {
          expect(
            shape[arg].safeParse(payload).success,
            `${tool}.${arg} accepted ${JSON.stringify(payload)}`
          ).toBe(false);
        }
        expect(shape[arg].safeParse("pot_0000abc-DEF").success).toBe(true);
      }
    }
  });

  it("covers every tool whose handler interpolates a path (guard against new ones)", () => {
    vi.stubGlobal("fetch", vi.fn());
    const tools = registerAll(true);
    // Any ID-looking argument that is not a plain string must use safeId too.
    for (const [tool, def] of Object.entries(tools)) {
      const shape = (def.inputSchema as any)?.def?.shape ?? {};
      for (const [arg, schema] of Object.entries(shape)) {
        if (/_id$|^id$/.test(arg) && arg !== "dedupe_id" && arg !== "image_id") {
          expect((schema as any).safeParse("../x").success, `${tool}.${arg}`).toBe(false);
        }
      }
    }
    vi.unstubAllGlobals();
  });
});
