import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MonzoClient, MonzoApiError } from "./client.js";

function mockOk(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

function mockError(status: number, body: unknown): Response {
  return {
    ok: false,
    status,
    text: async () =>
      typeof body === "string" ? body : JSON.stringify(body),
    json: async () => body,
  } as Response;
}

describe("MonzoClient", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function createClient(token = "test-token") {
    return new MonzoClient(token);
  }

  describe("GET requests", () => {
    it("sends GET with Authorization header", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ authenticated: true }));
      const client = createClient("my-token");
      const result = await client.get("/ping/whoami");

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.monzo.com/ping/whoami");
      expect(opts.method).toBe("GET");
      expect(opts.headers.Authorization).toBe("Bearer my-token");
      expect(result).toEqual({ authenticated: true });
    });

    it("appends query parameters", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ accounts: [] }));
      const client = createClient();
      await client.get("/accounts", { account_type: "uk_retail" });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("account_type=uk_retail");
    });

    it("handles empty response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => "",
      } as Response);

      const client = createClient();
      const result = await client.get("/some/endpoint");
      expect(result).toEqual({});
    });
  });

  describe("POST form requests", () => {
    it("sends form-encoded body with correct content type", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ success: true }));
      const client = createClient();
      await client.postForm("/webhooks", {
        account_id: "acc_123",
        url: "https://example.com/hook",
      });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("POST");
      expect(opts.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded"
      );
      expect(opts.body).toContain("account_id=acc_123");
      expect(opts.body).toContain("url=https");
    });
  });

  describe("PUT form requests", () => {
    it("sends PUT with form body", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ pot: "updated" }));
      const client = createClient();
      await client.putForm("/pots/pot_123/deposit", {
        source_account_id: "acc_123",
        amount: "1000",
        dedupe_id: "dedup_1",
      });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.monzo.com/pots/pot_123/deposit");
      expect(opts.method).toBe("PUT");
      expect(opts.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded"
      );
    });
  });

  describe("PATCH form requests", () => {
    it("sends PATCH with form body", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ updated: true }));
      const client = createClient();
      await client.patchForm("/transactions/tx_123", {
        "metadata[note]": "hello",
      });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("PATCH");
      expect(opts.headers["Content-Type"]).toBe(
        "application/x-www-form-urlencoded"
      );
    });
  });

  describe("PUT JSON requests", () => {
    it("sends JSON body with correct content type", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ receipt: "created" }));
      const client = createClient();
      const body = { transaction_id: "tx_123", items: [] };
      await client.putJson("/transaction-receipts", body);

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.method).toBe("PUT");
      expect(opts.headers["Content-Type"]).toBe("application/json");
      expect(opts.body).toBe(JSON.stringify(body));
    });
  });

  describe("DELETE requests", () => {
    it("sends DELETE with query params", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      const client = createClient();
      await client.deleteReq("/transaction-receipts", {
        external_id: "tx_123",
      });

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("external_id=tx_123");
      expect(opts.method).toBe("DELETE");
    });

    it("sends DELETE without params", async () => {
      mockFetch.mockResolvedValueOnce(mockOk({}));
      const client = createClient();
      await client.deleteReq("/webhooks/wh_123");

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.monzo.com/webhooks/wh_123");
      expect(opts.method).toBe("DELETE");
    });
  });

  describe("error handling", () => {
    it("throws MonzoApiError with parsed error body", async () => {
      mockFetch.mockResolvedValueOnce(
        mockError(401, {
          error: "unauthorized",
          message: "Access token expired",
        })
      );

      const client = createClient();
      try {
        await client.get("/ping/whoami");
        expect.fail("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(MonzoApiError);
        const apiError = error as MonzoApiError;
        expect(apiError.status).toBe(401);
        expect(apiError.errorCode).toBe("unauthorized");
        expect(apiError.message).toContain("Access token expired");
      }
    });

    it("uses error_description as fallback message", async () => {
      mockFetch.mockResolvedValueOnce(
        mockError(400, {
          error: "bad_request",
          error_description: "Missing param",
        })
      );

      const client = createClient();
      try {
        await client.get("/test");
        expect.fail("should have thrown");
      } catch (error) {
        const apiError = error as MonzoApiError;
        expect(apiError.message).toContain("Missing param");
      }
    });

    it("handles malformed error body gracefully", async () => {
      mockFetch.mockResolvedValueOnce(
        mockError(500, "not json at all")
      );

      const client = createClient();
      try {
        await client.get("/test");
        expect.fail("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(MonzoApiError);
        const apiError = error as MonzoApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.errorCode).toBe("unknown");
        expect(apiError.message).toContain("HTTP 500 error");
      }
    });

    it("formats error message correctly", () => {
      const err = new MonzoApiError(403, "forbidden", "Not allowed");
      expect(err.message).toBe(
        "Monzo API error (403): forbidden - Not allowed"
      );
      expect(err.name).toBe("MonzoApiError");
    });
  });
});
