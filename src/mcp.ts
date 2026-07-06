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
        description: "Send a quick WhatsApp message to a recipient. Routes automatically or accepts a specific device ID or sender phone number.",
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
            from: {
              type: "string",
              description: "Optional specific phone number to send from",
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
      {
        name: "sendzai_schedule_message",
        description: "Schedule a WhatsApp message or recurring sequence to be sent in the future.",
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
            at: {
              type: "string",
              description: "Send time: 'yyyy-MM-dd HH:mm' or ISO-8601 string",
            },
            timezone: {
              type: "string",
              description: "Timezone (default: UTC)",
            },
            deviceId: {
              type: "number",
              description: "Optional specific device ID slot to send from",
            },
            from: {
              type: "string",
              description: "Optional specific phone number to send from",
            },
            mediaUrl: {
              type: "string",
              description: "Optional public media URL",
            },
            windowStart: {
              type: "string",
              description: "Delivery window start: 'HH:mm' (e.g. 09:00)",
            },
            windowEnd: {
              type: "string",
              description: "Delivery window end: 'HH:mm' (e.g. 21:00)",
            },
            allowedDays: {
              type: "array",
              items: { type: "string" },
              description: "Allowed days (e.g. ['MON', 'TUE', 'WED'])",
            },
            randomize: {
              type: "boolean",
              description: "Randomize delivery within the window",
            },
            repeatUnit: {
              type: "string",
              description: "Recurrence unit: MINUTES | HOURS | DAYS | WEEKS | MONTHS | YEARS",
            },
            repeatInterval: {
              type: "number",
              description: "Repeat every N units",
            },
            maxRepeats: {
              type: "number",
              description: "Max number of repeats",
            },
            repeatEnd: {
              type: "string",
              description: "Stop repeating after this date ('yyyy-MM-dd HH:mm')",
            },
            times: {
              type: "array",
              items: { type: "string" },
              description: "Specific delivery times for SEVERAL type",
            },
            type: {
              type: "string",
              description: "Scheduling type: DAILY | WEEKDAY | WEEKEND | WEEKLY | MONTHLY | YEARLY | HOURLY | SEVERAL | CUSTOM | INTERVAL",
            },
          },
          required: ["to", "message", "at"],
        },
      },
      {
        name: "sendzai_list_schedules",
        description: "List all agent-scheduled messages and their statuses.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "sendzai_cancel_schedule",
        description: "Cancel a pending scheduled message by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "The scheduled message ID to cancel",
            },
          },
          required: ["id"],
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
        const fromPhone = args?.from ? String(args.from) : undefined;

        const result = await client.sendMessage(to, message, mediaUrl, deviceId, fromPhone);
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

      case "sendzai_schedule_message": {
        const result = await client.scheduleMessage({
          to: String(args?.to || ""),
          message: String(args?.message || ""),
          sendAt: String(args?.at || ""),
          timezone: args?.timezone ? String(args.timezone) : undefined,
          deviceId: args?.deviceId ? Number(args.deviceId) : undefined,
          fromPhone: args?.from ? String(args.from) : undefined,
          mediaUrl: args?.mediaUrl ? String(args.mediaUrl) : undefined,
          windowStart: args?.windowStart ? String(args.windowStart) : undefined,
          windowEnd: args?.windowEnd ? String(args.windowEnd) : undefined,
          allowedDays: args?.allowedDays ? (args.allowedDays as string[]) : undefined,
          randomizeInWindow: args?.randomize ? Boolean(args.randomize) : undefined,
          repeatUnit: args?.repeatUnit ? String(args.repeatUnit) : undefined,
          repeatInterval: args?.repeatInterval ? Number(args.repeatInterval) : undefined,
          maxRepeats: args?.maxRepeats ? Number(args.maxRepeats) : undefined,
          repeatEndAt: args?.repeatEnd ? String(args.repeatEnd) : undefined,
          specificTimes: args?.times ? (args.times as string[]) : undefined,
          type: args?.type ? String(args.type) : undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "sendzai_list_schedules": {
        const result = await client.listScheduledMessages();
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "sendzai_cancel_schedule": {
        const id = Number(args?.id);
        const result = await client.cancelScheduledMessage(id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
