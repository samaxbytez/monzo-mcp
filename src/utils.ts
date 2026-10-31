import { z } from "zod";

// IDs end up in request paths, so only characters Monzo IDs use are allowed.
export const safeId = (what: string) =>
  z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, "must contain only letters, digits, '_' and '-'")
    .max(100)
    .describe(what);

export function jsonResponse(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

export function errorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${msg}` }],
    isError: true,
  };
}

/** Drops undefined/null values and stringifies the rest, for query/form params. */
export function definedOnly(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) out[k] = String(v);
  }
  return out;
}

export function logToolCall(tool: string, params?: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = { ts: new Date().toISOString(), tool };
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      sanitized[k] = typeof v === "string" && v.length > 100 ? v.slice(0, 20) + "..." : v;
    }
  }
  console.error(JSON.stringify(sanitized));
}

/** Logs the call, runs it, and turns thrown errors into MCP error results. */
export async function runTool(
  tool: string,
  logged: Record<string, unknown> | undefined,
  fn: () => Promise<unknown>
) {
  logToolCall(tool, logged);
  try {
    return jsonResponse(await fn());
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Removes the pre-signed download links Monzo puts on transaction attachments,
 * so a bearer-less URL to a user's receipt photo never reaches the model (or
 * anything it can be talked into sending it to).
 */
export function stripAttachmentLinks<T>(data: T): T {
  if (Array.isArray(data)) return data.map(stripAttachmentLinks) as T;
  if (data && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [
        k,
        k === "attachments" && Array.isArray(v)
          ? v.map((a) => {
              if (!a || typeof a !== "object") return a;
              return Object.fromEntries(
                Object.entries(a).filter(([key]) => key !== "url")
              );
            })
          : stripAttachmentLinks(v),
      ])
    ) as T;
  }
  return data;
}
