import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { runTool, safeId } from "../utils.js";

export function registerFeedTools(server: McpServer, client: MonzoClient): void {
  server.registerTool(
    "monzo_create_feed_item",
    {
      title: "Create Feed Item",
      description:
        "Create a feed item in the Monzo app for a given account. The item appears in the user's transaction feed with a title, body, and optional image. Only available when MONZO_ENABLE_SENSITIVE_TOOLS=true.",
      inputSchema: {
        account_id: safeId("The account ID to create the feed item for"),
        title: z.string().min(1).max(200).describe("The title of the feed item"),
        body: z.string().max(2000).describe("The body text of the feed item"),
        image_url: z
          .url({ protocol: /^https$/ })
          .optional()
          .describe("https URL of an image to display with the feed item"),
        url: z
          .url({ protocol: /^https$/ })
          .optional()
          .describe("https URL to open when the feed item is tapped"),
      },
    },
    ({ account_id, title, body, image_url, url }) =>
      runTool("monzo_create_feed_item", { account_id, title }, () =>
        client.postForm("/feed", {
          account_id,
          type: "basic",
          "params[title]": title,
          "params[body]": body,
          ...(image_url && { "params[image_url]": image_url }),
          ...(url && { url }),
        })
      )
  );
}
