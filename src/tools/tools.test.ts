import { describe, it, expect, vi, beforeEach } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MonzoClient } from "../client.js";
import { registerAccountTools } from "./accounts.js";
import { registerPotTools } from "./pots.js";
import { registerTransactionTools } from "./transactions.js";
import { registerFeedTools } from "./feed.js";
import { registerAttachmentTools } from "./attachments.js";
import { registerReceiptTools } from "./receipts.js";
import { registerWebhookTools } from "./webhooks.js";

type ToolHandler = (...args: unknown[]) => Promise<unknown>;

function createMockServer() {
  const tools = new Map<string, ToolHandler>();
  return {
    server: {
      registerTool: vi.fn(
        (name: string, _config: unknown, cb: ToolHandler) => {
          tools.set(name, cb);
        }
      ),
    } as unknown as McpServer,
    tools,
  };
}

function createMockClient() {
  return {
    get: vi.fn().mockResolvedValue({ data: "mock" }),
    postForm: vi.fn().mockResolvedValue({ data: "mock" }),
    putForm: vi.fn().mockResolvedValue({ data: "mock" }),
    patchForm: vi.fn().mockResolvedValue({ data: "mock" }),
    putJson: vi.fn().mockResolvedValue({ data: "mock" }),
    deleteReq: vi.fn().mockResolvedValue({ data: "mock" }),
  } as unknown as MonzoClient;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Account Tools ──────────────────────────────────────────────────────

describe("Account tools", () => {
  it("registers 3 account tools", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAccountTools(server, client);
    expect(tools.size).toBe(3);
    expect(tools.has("monzo_whoami")).toBe(true);
    expect(tools.has("monzo_list_accounts")).toBe(true);
    expect(tools.has("monzo_get_balance")).toBe(true);
  });

  it("monzo_whoami calls client.get and returns jsonResponse", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAccountTools(server, client);

    const handler = tools.get("monzo_whoami")!;
    const result = (await handler({})) as { content: { type: string; text: string }[] };

    expect(client.get).toHaveBeenCalledWith("/ping/whoami");
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ data: "mock" });
  });

  it("monzo_list_accounts passes account_type param", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAccountTools(server, client);

    const handler = tools.get("monzo_list_accounts")!;
    await handler({ account_type: "uk_retail" });

    expect(client.get).toHaveBeenCalledWith("/accounts", {
      account_type: "uk_retail",
    });
  });

  it("monzo_list_accounts omits undefined account_type", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAccountTools(server, client);

    const handler = tools.get("monzo_list_accounts")!;
    await handler({ account_type: undefined });

    expect(client.get).toHaveBeenCalledWith("/accounts", {});
  });

  it("monzo_get_balance passes account_id", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAccountTools(server, client);

    const handler = tools.get("monzo_get_balance")!;
    await handler({ account_id: "acc_123" });

    expect(client.get).toHaveBeenCalledWith("/balance", {
      account_id: "acc_123",
    });
  });

  it("returns errorResponse when client throws", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    (client.get as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network down")
    );
    registerAccountTools(server, client);

    const handler = tools.get("monzo_whoami")!;
    const result = (await handler({})) as {
      content: { text: string }[];
      isError: boolean;
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("network down");
  });
});

// ─── Pot Tools ──────────────────────────────────────────────────────────

describe("Pot tools", () => {
  it("registers 3 pot tools", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerPotTools(server, client);
    expect(tools.size).toBe(3);
    expect(tools.has("monzo_list_pots")).toBe(true);
    expect(tools.has("monzo_deposit_into_pot")).toBe(true);
    expect(tools.has("monzo_withdraw_from_pot")).toBe(true);
  });

  it("monzo_list_pots passes current_account_id", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerPotTools(server, client);

    await tools.get("monzo_list_pots")!({ current_account_id: "acc_123" });
    expect(client.get).toHaveBeenCalledWith("/pots", {
      current_account_id: "acc_123",
    });
  });

  it("monzo_deposit_into_pot calls putForm with correct path and body", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerPotTools(server, client);

    await tools.get("monzo_deposit_into_pot")!({
      pot_id: "pot_abc",
      source_account_id: "acc_123",
      amount: 1000,
      dedupe_id: "dedup_1",
    });

    expect(client.putForm).toHaveBeenCalledWith("/pots/pot_abc/deposit", {
      source_account_id: "acc_123",
      amount: "1000",
      dedupe_id: "dedup_1",
    });
  });

  it("monzo_withdraw_from_pot calls putForm with correct path and body", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerPotTools(server, client);

    await tools.get("monzo_withdraw_from_pot")!({
      pot_id: "pot_abc",
      destination_account_id: "acc_123",
      amount: 500,
      dedupe_id: "dedup_2",
    });

    expect(client.putForm).toHaveBeenCalledWith("/pots/pot_abc/withdraw", {
      destination_account_id: "acc_123",
      amount: "500",
      dedupe_id: "dedup_2",
    });
  });
});

// ─── Transaction Tools ──────────────────────────────────────────────────

describe("Transaction tools", () => {
  it("registers 3 transaction tools", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerTransactionTools(server, client);
    expect(tools.size).toBe(3);
    expect(tools.has("monzo_list_transactions")).toBe(true);
    expect(tools.has("monzo_get_transaction")).toBe(true);
    expect(tools.has("monzo_annotate_transaction")).toBe(true);
  });

  it("monzo_list_transactions builds params and calls client.get", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerTransactionTools(server, client);

    await tools.get("monzo_list_transactions")!({
      account_id: "acc_123",
      since: "2024-01-01T00:00:00Z",
      limit: 50,
      before: undefined,
    });

    expect(client.get).toHaveBeenCalledWith("/transactions", {
      account_id: "acc_123",
      since: "2024-01-01T00:00:00Z",
      limit: "50",
    });
  });

  it("monzo_get_transaction expands merchant when requested", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerTransactionTools(server, client);

    await tools.get("monzo_get_transaction")!({
      transaction_id: "tx_123",
      expand_merchant: true,
    });

    expect(client.get).toHaveBeenCalledWith("/transactions/tx_123", {
      "expand[]": "merchant",
    });
  });

  it("monzo_get_transaction omits expand when not requested", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerTransactionTools(server, client);

    await tools.get("monzo_get_transaction")!({
      transaction_id: "tx_123",
      expand_merchant: false,
    });

    expect(client.get).toHaveBeenCalledWith("/transactions/tx_123", {});
  });

  it("monzo_annotate_transaction sends metadata key-value", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerTransactionTools(server, client);

    await tools.get("monzo_annotate_transaction")!({
      transaction_id: "tx_123",
      key: "note",
      value: "coffee",
    });

    expect(client.patchForm).toHaveBeenCalledWith("/transactions/tx_123", {
      "metadata[note]": "coffee",
    });
  });
});

// ─── Feed Tools ─────────────────────────────────────────────────────────

describe("Feed tools", () => {
  it("registers 1 feed tool", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerFeedTools(server, client);
    expect(tools.size).toBe(1);
    expect(tools.has("monzo_create_feed_item")).toBe(true);
  });

  it("monzo_create_feed_item sends form body with required fields", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerFeedTools(server, client);

    await tools.get("monzo_create_feed_item")!({
      account_id: "acc_123",
      title: "Hello",
      body: "World",
      image_url: undefined,
      url: undefined,
    });

    expect(client.postForm).toHaveBeenCalledWith("/feed", {
      account_id: "acc_123",
      type: "basic",
      "params[title]": "Hello",
      "params[body]": "World",
    });
  });

  it("monzo_create_feed_item includes optional image_url and url", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerFeedTools(server, client);

    await tools.get("monzo_create_feed_item")!({
      account_id: "acc_123",
      title: "Hello",
      body: "World",
      image_url: "https://example.com/img.png",
      url: "https://example.com",
    });

    expect(client.postForm).toHaveBeenCalledWith("/feed", {
      account_id: "acc_123",
      type: "basic",
      "params[title]": "Hello",
      "params[body]": "World",
      "params[image_url]": "https://example.com/img.png",
      url: "https://example.com",
    });
  });
});

// ─── Attachment Tools ───────────────────────────────────────────────────

describe("Attachment tools", () => {
  it("registers 3 attachment tools", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAttachmentTools(server, client);
    expect(tools.size).toBe(3);
    expect(tools.has("monzo_upload_attachment")).toBe(true);
    expect(tools.has("monzo_register_attachment")).toBe(true);
    expect(tools.has("monzo_deregister_attachment")).toBe(true);
  });

  it("monzo_upload_attachment sends form body with content_length as string", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAttachmentTools(server, client);

    await tools.get("monzo_upload_attachment")!({
      file_name: "receipt.png",
      file_type: "image/png",
      content_length: 12345,
    });

    expect(client.postForm).toHaveBeenCalledWith("/attachment/upload", {
      file_name: "receipt.png",
      file_type: "image/png",
      content_length: "12345",
    });
  });

  it("monzo_register_attachment sends form body", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAttachmentTools(server, client);

    await tools.get("monzo_register_attachment")!({
      external_id: "tx_123",
      file_url: "https://example.com/file.png",
      file_type: "image/png",
    });

    expect(client.postForm).toHaveBeenCalledWith("/attachment/register", {
      external_id: "tx_123",
      file_url: "https://example.com/file.png",
      file_type: "image/png",
    });
  });

  it("monzo_deregister_attachment sends form body with id", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerAttachmentTools(server, client);

    await tools.get("monzo_deregister_attachment")!({ id: "att_456" });

    expect(client.postForm).toHaveBeenCalledWith("/attachment/deregister", {
      id: "att_456",
    });
  });
});

// ─── Receipt Tools ──────────────────────────────────────────────────────

describe("Receipt tools", () => {
  it("registers 3 receipt tools", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerReceiptTools(server, client);
    expect(tools.size).toBe(3);
    expect(tools.has("monzo_create_receipt")).toBe(true);
    expect(tools.has("monzo_get_receipt")).toBe(true);
    expect(tools.has("monzo_delete_receipt")).toBe(true);
  });

  it("monzo_create_receipt sends JSON body with parsed items", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerReceiptTools(server, client);

    const items = [
      { description: "Coffee", amount: 350, currency: "GBP", quantity: 1 },
    ];

    await tools.get("monzo_create_receipt")!({
      transaction_id: "tx_123",
      items: JSON.stringify(items),
      tax: undefined,
    });

    expect(client.putJson).toHaveBeenCalledWith("/transaction-receipts", {
      transaction_id: "tx_123",
      external_id: "tx_123",
      items,
    });
  });

  it("monzo_create_receipt includes tax when provided", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerReceiptTools(server, client);

    const items = [
      { description: "Lunch", amount: 1200, currency: "GBP", quantity: 1 },
    ];

    await tools.get("monzo_create_receipt")!({
      transaction_id: "tx_456",
      items: JSON.stringify(items),
      tax: 200,
    });

    expect(client.putJson).toHaveBeenCalledWith("/transaction-receipts", {
      transaction_id: "tx_456",
      external_id: "tx_456",
      items,
      tax: 200,
    });
  });

  it("monzo_get_receipt passes external_id", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerReceiptTools(server, client);

    await tools.get("monzo_get_receipt")!({ external_id: "tx_123" });

    expect(client.get).toHaveBeenCalledWith("/transaction-receipts", {
      external_id: "tx_123",
    });
  });

  it("monzo_delete_receipt calls deleteReq", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerReceiptTools(server, client);

    await tools.get("monzo_delete_receipt")!({ external_id: "tx_123" });

    expect(client.deleteReq).toHaveBeenCalledWith("/transaction-receipts", {
      external_id: "tx_123",
    });
  });

  it("returns errorResponse on invalid JSON items", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerReceiptTools(server, client);

    const result = (await tools.get("monzo_create_receipt")!({
      transaction_id: "tx_123",
      items: "not valid json",
      tax: undefined,
    })) as { isError: boolean; content: { text: string }[] };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error");
  });
});

// ─── Webhook Tools ──────────────────────────────────────────────────────

describe("Webhook tools", () => {
  it("registers 3 webhook tools", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerWebhookTools(server, client);
    expect(tools.size).toBe(3);
    expect(tools.has("monzo_register_webhook")).toBe(true);
    expect(tools.has("monzo_list_webhooks")).toBe(true);
    expect(tools.has("monzo_delete_webhook")).toBe(true);
  });

  it("monzo_register_webhook sends form body", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerWebhookTools(server, client);

    await tools.get("monzo_register_webhook")!({
      account_id: "acc_123",
      url: "https://example.com/hook",
    });

    expect(client.postForm).toHaveBeenCalledWith("/webhooks", {
      account_id: "acc_123",
      url: "https://example.com/hook",
    });
  });

  it("monzo_list_webhooks passes account_id", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerWebhookTools(server, client);

    await tools.get("monzo_list_webhooks")!({ account_id: "acc_123" });

    expect(client.get).toHaveBeenCalledWith("/webhooks", {
      account_id: "acc_123",
    });
  });

  it("monzo_delete_webhook calls deleteReq with path", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    registerWebhookTools(server, client);

    await tools.get("monzo_delete_webhook")!({ webhook_id: "wh_789" });

    expect(client.deleteReq).toHaveBeenCalledWith("/webhooks/wh_789");
  });

  it("returns errorResponse when client throws", async () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();
    (client.postForm as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("timeout")
    );
    registerWebhookTools(server, client);

    const result = (await tools.get("monzo_register_webhook")!({
      account_id: "acc_123",
      url: "https://example.com/hook",
    })) as { isError: boolean; content: { text: string }[] };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("timeout");
  });
});

// ─── Cross-cutting: all tool registrations ──────────────────────────────

describe("All tools combined", () => {
  it("registers all 19 tools without conflicts", () => {
    const { server, tools } = createMockServer();
    const client = createMockClient();

    registerAccountTools(server, client);
    registerPotTools(server, client);
    registerTransactionTools(server, client);
    registerFeedTools(server, client);
    registerAttachmentTools(server, client);
    registerReceiptTools(server, client);
    registerWebhookTools(server, client);

    expect(tools.size).toBe(19);
  });
});
