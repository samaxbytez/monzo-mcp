import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MonzoClient } from "../client.js";
import { jsonResponse, errorResponse, logToolCall } from "../utils.js";

export function registerAttachmentTools(
  server: McpServer,
  client: MonzoClient
): void {
  server.registerTool(
    "monzo_upload_attachment",
    {
      title: "Upload Attachment",
      description:
        "Get a pre-signed upload URL for attaching an image to a Monzo transaction. Returns the upload URL and file URL to use with monzo_register_attachment.",
      inputSchema: {
        file_name: z
          .string()
          .describe("The name of the file (e.g. 'receipt.png')"),
        file_type: z
          .string()
          .describe("The MIME type of the file (e.g. 'image/png', 'image/jpeg')"),
        content_length: z
          .number()
          .int()
          .positive()
          .describe("The file size in bytes"),
      },
    },
    async ({ file_name, file_type, content_length }) => {
      logToolCall("monzo_upload_attachment", { file_name, file_type });
      try {
        const result = await client.postForm("/attachment/upload", {
          file_name,
          file_type,
          content_length: String(content_length),
        });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_register_attachment",
    {
      title: "Register Attachment",
      description:
        "Register an uploaded image as an attachment on a Monzo transaction. The image must already be uploaded to the URL from monzo_upload_attachment.",
      inputSchema: {
        external_id: z
          .string()
          .describe("The transaction ID to attach the image to"),
        file_url: z
          .string()
          .describe("The file_url returned from monzo_upload_attachment"),
        file_type: z
          .string()
          .describe("The MIME type of the file (e.g. 'image/png')"),
      },
    },
    async ({ external_id, file_url, file_type }) => {
      logToolCall("monzo_register_attachment", { external_id });
      try {
        const result = await client.postForm("/attachment/register", {
          external_id,
          file_url,
          file_type,
        });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );

  server.registerTool(
    "monzo_deregister_attachment",
    {
      title: "Deregister Attachment",
      description:
        "Remove an attachment from a Monzo transaction.",
      inputSchema: {
        id: z
          .string()
          .describe("The attachment ID to remove"),
      },
    },
    async ({ id }) => {
      logToolCall("monzo_deregister_attachment", { id });
      try {
        const result = await client.postForm("/attachment/deregister", { id });
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error);
      }
    }
  );
}
