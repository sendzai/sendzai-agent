import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SendzaiClient } from "./client.js";

const server = new Server(
  {
    name: "sendzai",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sendzai_get_status",
        description: "Check overall Sendzai subscription status, quotas, and connected WhatsApp sessions.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "sendzai_list_sessions",
        description: "List connected WhatsApp numbers, active sessions, and connection statuses.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "sendzai_send_message",
        description: "Send a quick WhatsApp message to a recipient. Routes automatically or accepts a specific device ID.",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient phone number with country code (e.g. +919876543210)",
            },
            message: {
              type: "string",
              description: "The text message body to send",
            },
            mediaUrl: {
              type: "string",
              description: "Optional public URL of an image/media file to send",
            },
            deviceId: {
              type: "number",
              description: "Optional specific device ID slot to send from",
            },
          },
          required: ["to", "message"],
        },
      },
      {
        name: "sendzai_list_campaigns",
        description: "List recent campaigns and their statuses (DRAFT, RUNNING, COMPLETED, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Optional status to filter campaigns",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const client = new SendzaiClient();

    switch (name) {
      case "sendzai_get_status": {
        const status = await client.getStatus();
        return {
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
        };
      }

      case "sendzai_list_sessions": {
        const sessions = await client.listWhatsAppNumbers();
        return {
          content: [{ type: "text", text: JSON.stringify(sessions, null, 2) }],
        };
      }

      case "sendzai_send_message": {
        const to = String(args?.to || "");
        const message = String(args?.message || "");
        const mediaUrl = args?.mediaUrl ? String(args.mediaUrl) : undefined;
        const deviceId = args?.deviceId ? Number(args.deviceId) : undefined;

        const result = await client.sendMessage(to, message, mediaUrl, deviceId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "sendzai_list_campaigns": {
        const status = args?.status ? String(args.status) : undefined;
        const campaigns = await client.listCampaigns(status);
        return {
          content: [{ type: "text", text: JSON.stringify(campaigns, null, 2) }],
        };
      }

      default:
        throw new Error(`Tool ${name} not found`);
    }
  } catch (e: any) {
    const errMsg = e.response?.data?.message || e.message;
    return {
      isError: true,
      content: [{ type: "text", text: JSON.stringify({ success: false, error: errMsg }, null, 2) }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP Server Error:", error);
  process.exit(1);
});
