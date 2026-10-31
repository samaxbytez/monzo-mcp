const DEFAULT_BASE_URL = "https://api.monzo.com/";
const REQUEST_TIMEOUT_MS = 30_000;

export class MonzoApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(`Monzo API error (${status}): ${errorCode} - ${message}`);
    this.name = "MonzoApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

function parseApiError(response: Response, body: string): MonzoApiError {
  const { status } = response;
  if (status === 429) {
    const retryAfter = response.headers?.get("retry-after");
    return new MonzoApiError(
      status,
      "rate_limited",
      `Monzo rate limit reached${retryAfter ? `; retry after ${retryAfter} seconds` : ""}`
    );
  }
  try {
    const parsed = JSON.parse(body);
    const code = parsed?.error ?? parsed?.code ?? "unknown";
    const message = parsed?.message ?? parsed?.error_description ?? `HTTP ${status}`;
    return new MonzoApiError(status, code, message);
  } catch {
    // Not JSON (e.g. a proxy's HTML page): don't echo it to the model.
    return new MonzoApiError(status, "unknown", `HTTP ${status} error`);
  }
}

/**
 * Validates MONZO_API_URL. The token is sent to this host, so only https is
 * accepted, plus plain http on loopback for local testing.
 */
export function parseBaseUrl(raw: string | undefined): URL {
  const url = new URL(raw || DEFAULT_BASE_URL);
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error(
      `MONZO_API_URL must be https (or http on loopback), got ${url.protocol}`
    );
  }
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

export class MonzoClient {
  private accessToken: string;
  private base: URL;

  constructor(accessToken: string, baseUrl?: string) {
    this.accessToken = accessToken;
    this.base = parseBaseUrl(baseUrl);
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  async postForm<T = unknown>(path: string, body?: Record<string, string>): Promise<T> {
    return this.request<T>("POST", path, { body, bodyType: "form" });
  }

  async putForm<T = unknown>(path: string, body?: Record<string, string>): Promise<T> {
    return this.request<T>("PUT", path, { body, bodyType: "form" });
  }

  async patchForm<T = unknown>(path: string, body?: Record<string, string>): Promise<T> {
    return this.request<T>("PATCH", path, { body, bodyType: "form" });
  }

  async putJson<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body, bodyType: "json" });
  }

  async deleteReq<T = unknown>(
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    return this.request<T>("DELETE", path, { params });
  }

  /** Resolves `path` under the API base, refusing anything that could leave it. */
  private resolve(path: string): URL {
    // Only plain, absolute-from-base paths: no scheme, host, query, encoding or "..".
    if (
      !/^\/[A-Za-z0-9_\-./]*$/.test(path) ||
      path.startsWith("//") ||
      /(^|\/)\.\.?(\/|$)/.test(path)
    ) {
      throw new Error(`Refusing request path: ${JSON.stringify(path.slice(0, 80))}`);
    }
    const url = new URL(this.base.pathname.replace(/\/$/, "") + path, this.base);
    if (url.origin !== this.base.origin || !url.pathname.startsWith(this.base.pathname)) {
      throw new Error("Refusing request path outside the Monzo API");
    }
    return url;
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; bodyType?: "form" | "json"; params?: Record<string, string> }
  ): Promise<T> {
    const url = this.resolve(path);
    for (const [k, v] of Object.entries(opts.params ?? {})) url.searchParams.set(k, v);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };
    let body: string | undefined;
    if (opts.body && opts.bodyType === "json") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    } else if (opts.body && opts.bodyType === "form") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(opts.body as Record<string, string>).toString();
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
      // Never follow a redirect: the bearer token must only go to the API host.
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const text = await response.text();
    if (!response.ok) throw parseApiError(response, text);
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new MonzoApiError(
        response.status,
        "invalid_response",
        "Monzo returned a non-JSON response"
      );
    }
  }
}
