import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall } from "../utils.js";

export function registerFeedTools(
  server: McpServer,
  client: MonzoClient
): void {
  server.registerTool(
    "monzo_create_feed_item",
    {
      title: "Create Feed Item",
      description:
        "Create a feed item in the Monzo app for a given account. The item appears in the user's transaction feed with a title, body, and optional image.",
      inputSchema: {
        account_id: z
          .string()
          .describe("The account ID to create the feed item for"),
        title: z
          .string()
          .describe("The title of the feed item"),
        body: z
          .string()
          .describe("The body text of the feed item"),
        image_url: z
          .string()
          .optional()
          .describe("URL of an image to display with the feed item"),
        url: z
          .string()
          .optional()
          .describe("URL to open when the feed item is tapped"),
      },
    },
    async ({ account_id, title, body, image_url, url }) => {
      logToolCall("monzo_create_feed_item", { account_id, title });
      try {
        const formBody: Record<string, string> = {
          account_id,
          type: "basic",
          "params[title]": title,
          "params[body]": body,
        };
        if (image_url) formBody["params[image_url]"] = image_url;
        if (url) formBody["url"] = url;

        const result = await client.postForm("/feed", formBody);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
