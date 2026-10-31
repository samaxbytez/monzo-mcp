import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  jsonResponse,
  errorResponse,
  definedOnly,
  safeId,
  stripAttachmentLinks,
  logToolCall,
} from "./utils.js";

describe("jsonResponse()", () => {
  it("wraps data in MCP text content", () => {
    const result = jsonResponse({ balance: 1000 });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ balance: 1000 });
  });

  it("emits compact JSON", () => {
    const result = jsonResponse({ a: 1 });
    expect(result.content[0].text).toBe('{"a":1}');
  });
});

describe("errorResponse()", () => {
  it("extracts message from Error instances", () => {
    const result = errorResponse(new Error("something broke"));
    expect(result.content[0].text).toBe("Error: something broke");
    expect(result.isError).toBe(true);
  });

  it("converts non-Error values to string", () => {
    const result = errorResponse("raw string");
    expect(result.content[0].text).toBe("Error: raw string");
    expect(result.isError).toBe(true);
  });

  it("handles numeric error", () => {
    const result = errorResponse(404);
    expect(result.content[0].text).toBe("Error: 404");
    expect(result.isError).toBe(true);
  });
});

describe("definedOnly()", () => {
  it("converts values to strings", () => {
    expect(definedOnly({ limit: 50, account_id: "acc_123" })).toEqual({
      limit: "50",
      account_id: "acc_123",
    });
  });

  it("filters out undefined values", () => {
    expect(definedOnly({ a: "yes", b: undefined })).toEqual({ a: "yes" });
  });

  it("filters out null values", () => {
    expect(definedOnly({ a: "yes", b: null })).toEqual({ a: "yes" });
  });

  it("returns empty object when all values are undefined", () => {
    expect(definedOnly({ a: undefined, b: undefined })).toEqual({});
  });
});

describe("logToolCall()", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("logs JSON with tool name and timestamp", () => {
    logToolCall("monzo_whoami");
    expect(errorSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(logged.tool).toBe("monzo_whoami");
    expect(logged.ts).toBeDefined();
  });

  it("includes params in log output", () => {
    logToolCall("monzo_get_balance", { account_id: "acc_123" });
    const logged = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(logged.account_id).toBe("acc_123");
  });

  it("truncates long string params", () => {
    const longValue = "a".repeat(150);
    logToolCall("monzo_test", { data: longValue });
    const logged = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(logged.data).toBe("a".repeat(20) + "...");
  });

  it("does not truncate short string params", () => {
    logToolCall("monzo_test", { data: "short" });
    const logged = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(logged.data).toBe("short");
  });
});

describe("safeId()", () => {
  it("accepts Monzo-style IDs and rejects path/query tricks", () => {
    const schema = safeId("id");
    expect(schema.safeParse("acc_0000A1b2-C3").success).toBe(true);
    for (const bad of [
      "../x",
      "%2e%2e/x",
      "1?x",
      "1#x",
      "a/b",
      "",
      "a b",
      "x".repeat(101),
    ]) {
      expect(schema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe("stripAttachmentLinks()", () => {
  it("removes attachment urls at any depth and keeps the rest", () => {
    const out = stripAttachmentLinks({
      transactions: [
        {
          id: "tx_1",
          attachments: [{ id: "a1", url: "https://s3/x?sig=1", type: "image/png" }],
        },
      ],
    });
    expect(out).toEqual({
      transactions: [{ id: "tx_1", attachments: [{ id: "a1", type: "image/png" }] }],
    });
  });
  it("leaves unrelated url fields alone", () => {
    expect(stripAttachmentLinks({ merchant: { url: "https://m" } })).toEqual({
      merchant: { url: "https://m" },
    });
  });
});
