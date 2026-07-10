import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SendzaiClient } from "./client.js";
import { z } from "zod";
const server = new McpServer({
    name: "sendzai",
    version: "1.0.6",
});
const client = new SendzaiClient();
// Helper to catch errors and return formatted error messages
async function handleToolCall(fn, mapper) {
    try {
        let result = await fn();
        if (mapper) {
            result = mapper(result);
        }
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            structuredContent: result,
        };
    }
    catch (e) {
        const errMsg = e.response?.data?.message || e.message;
        return {
            isError: true,
            content: [{ type: "text", text: JSON.stringify({ success: false, error: errMsg }, null, 2) }],
        };
    }
}
// 1. sendzai_get_status
server.registerTool("sendzai_get_status", {
    description: "Check overall Sendzai subscription status, quotas, and connected WhatsApp sessions.",
    inputSchema: {},
    outputSchema: z.object({
        subscriptionStatus: z.string(),
        planName: z.string(),
        remainingMessageQuota: z.number(),
        totalMessageLimit: z.number(),
        connectedWhatsAppSessions: z.number(),
        totalWhatsAppSessions: z.number(),
        activeCampaigns: z.number(),
    })
}, async () => {
    return handleToolCall(() => client.getStatus());
});
// 2. sendzai_list_sessions
server.registerTool("sendzai_list_sessions", {
    description: "List connected WhatsApp numbers, active sessions, and connection statuses.",
    inputSchema: {},
    outputSchema: z.object({
        sessions: z.array(z.object({
            id: z.number(),
            phone: z.string(),
            name: z.string().nullable(),
            provider: z.string(),
            isActive: z.boolean(),
            status: z.string(),
        }))
    })
}, async () => {
    return handleToolCall(() => client.listWhatsAppNumbers(), (res) => ({ sessions: res }));
});
// 3. sendzai_send_message
server.registerTool("sendzai_send_message", {
    description: "Send a quick WhatsApp message to a recipient. Routes automatically or accepts a specific device ID or sender phone number.",
    inputSchema: {
        to: z.string().describe("Recipient phone number, contact name, or WhatsApp group name (e.g. +919876543210, Jane, or Sales Group)"),
        message: z.string().describe("The text message body to send"),
        mediaUrl: z.string().optional().describe("Optional public URL of an image/media file to send"),
        deviceId: z.number().optional().describe("Optional specific device ID slot to send from"),
        from: z.string().optional().describe("Optional specific phone number or session display name to send from (e.g. John)"),
        dryRun: z.boolean().optional().describe("Validate inputs and preview resolution without sending")
    },
    outputSchema: z.object({
        success: z.boolean(),
        senderNumber: z.string(),
        recipientNumber: z.string(),
        dryRun: z.boolean(),
    })
}, async (args) => {
    return handleToolCall(() => client.sendMessage(args.to, args.message, args.mediaUrl, args.deviceId, args.from, args.dryRun));
});
// 4. sendzai_list_campaigns
server.registerTool("sendzai_list_campaigns", {
    description: "List recent campaigns and their statuses (DRAFT, RUNNING, COMPLETED, etc.).",
    inputSchema: {
        status: z.string().optional().describe("Optional status to filter campaigns")
    },
    outputSchema: z.object({
        campaigns: z.array(z.object({
            id: z.number(),
            name: z.string(),
            status: z.string(),
            totalContacts: z.number(),
            sentCount: z.number(),
            failedCount: z.number(),
        }))
    })
}, async (args) => {
    return handleToolCall(() => client.listCampaigns(args.status));
});
// 5. sendzai_schedule_message
server.registerTool("sendzai_schedule_message", {
    description: "Schedule a WhatsApp message or recurring sequence to be sent in the future.",
    inputSchema: {
        to: z.string().describe("Recipient phone number, contact name, or WhatsApp group name (e.g. +919876543210, Jane, or AutoSend Test Group)"),
        message: z.string().describe("The text message body to send"),
        at: z.string().describe("Send time: 'yyyy-MM-dd HH:mm' or ISO-8601 string"),
        timezone: z.string().optional().describe("Timezone identifier (e.g. Asia/Kolkata). Defaults to the user's account timezone if not specified."),
        deviceId: z.number().optional().describe("Optional specific device ID slot to send from"),
        from: z.string().optional().describe("Optional specific phone number or session display name to send from (e.g. Vexx)"),
        mediaUrl: z.string().optional().describe("Optional public media URL"),
        windowStart: z.string().optional().describe("Delivery window start: 'HH:mm' (e.g. 09:00)"),
        windowEnd: z.string().optional().describe("Delivery window end: 'HH:mm' (e.g. 21:00)"),
        allowedDays: z.array(z.string()).optional().describe("Allowed days (e.g. ['MON', 'TUE', 'WED'])"),
        randomize: z.boolean().optional().describe("Randomize delivery within the window"),
        repeatUnit: z.string().optional().describe("Recurrence unit: MINUTES | HOURS | DAYS | WEEKS | MONTHS | YEARS"),
        repeatInterval: z.number().optional().describe("Repeat every N units"),
        maxRepeats: z.number().optional().describe("Max number of repeats"),
        repeatEnd: z.string().optional().describe("Stop repeating after this date ('yyyy-MM-dd HH:mm')"),
        times: z.array(z.string()).optional().describe("Specific delivery times for SEVERAL type"),
        type: z.string().optional().describe("Scheduling type: DAILY | WEEKDAY | WEEKEND | WEEKLY | MONTHLY | YEARLY | HOURLY | SEVERAL | CUSTOM | INTERVAL")
    },
    outputSchema: z.object({
        id: z.number(),
        to: z.string(),
        message: z.string(),
        status: z.string(),
        timezone: z.string(),
        isRecurring: z.boolean(),
    })
}, async (args) => {
    return handleToolCall(() => client.scheduleMessage({
        to: args.to,
        message: args.message,
        sendAt: args.at,
        timezone: args.timezone,
        deviceId: args.deviceId,
        fromPhone: args.from,
        mediaUrl: args.mediaUrl,
        windowStart: args.windowStart,
        windowEnd: args.windowEnd,
        allowedDays: args.allowedDays,
        randomizeInWindow: args.randomize,
        repeatUnit: args.repeatUnit,
        repeatInterval: args.repeatInterval,
        maxRepeats: args.maxRepeats,
        repeatEndAt: args.repeatEnd,
        specificTimes: args.times,
        type: args.type,
    }));
});
// 6. sendzai_list_schedules
server.registerTool("sendzai_list_schedules", {
    description: "List all active, upcoming scheduled WhatsApp messages.",
    inputSchema: {},
    outputSchema: z.object({
        schedules: z.array(z.object({
            id: z.number(),
            to: z.string(),
            message: z.string(),
            status: z.string(),
            timezone: z.string(),
            isRecurring: z.boolean(),
        }))
    })
}, async () => {
    return handleToolCall(() => client.listScheduledMessages(), (res) => ({ schedules: res }));
});
// 7. sendzai_cancel_schedule
server.registerTool("sendzai_cancel_schedule", {
    description: "Cancel a pending scheduled message by its ID.",
    inputSchema: {
        id: z.number().describe("The scheduled message ID to cancel")
    },
    outputSchema: z.object({
        success: z.boolean(),
        message: z.string(),
    })
}, async (args) => {
    return handleToolCall(() => client.cancelScheduledMessage(args.id));
});
// 8. sendzai_list_recipient_lists
server.registerTool("sendzai_list_recipient_lists", {
    description: "List/search your recipient contact lists.",
    inputSchema: {
        query: z.string().optional().describe("Optional query to filter list names")
    },
    outputSchema: z.object({
        lists: z.array(z.object({
            id: z.number(),
            name: z.string(),
            contactCount: z.number(),
        }))
    })
}, async (args) => {
    return handleToolCall(() => client.listRecipientLists(args.query), (res) => ({ lists: res }));
});
// 9. sendzai_search_contacts
server.registerTool("sendzai_search_contacts", {
    description: "Search for individual contacts/recipients across list groups. Prioritizes exact matches on name/phone first, falling back to partial contains matches.",
    inputSchema: {
        query: z.string().optional().describe("Optional name or phone search string (prioritizes exact case-insensitive matches, falls back to partial match)"),
        listId: z.number().optional().describe("Optional filter to restrict search to a specific contact list")
    },
    outputSchema: z.object({
        contacts: z.array(z.object({
            name: z.string().nullable(),
            phoneNumber: z.string(),
            listId: z.number(),
        }))
    })
}, async (args) => {
    return handleToolCall(() => client.searchContacts(args.query, args.listId), (res) => ({ contacts: res }));
});
// 10. sendzai_search_groups
server.registerTool("sendzai_search_groups", {
    description: "List/search active WhatsApp groups on connected numbers. Prioritizes exact matches on group name, falling back to partial contains matches.",
    inputSchema: {
        query: z.string().optional().describe("Optional name search string (prioritizes exact case-insensitive matches, falls back to partial match)"),
        deviceId: z.number().optional().describe("Optional filter to restrict search to a specific sender device/number")
    },
    outputSchema: z.object({
        groups: z.array(z.object({
            id: z.number(),
            name: z.string(),
            groupJid: z.string(),
            whatsappNumberId: z.number(),
        }))
    })
}, async (args) => {
    return handleToolCall(() => client.searchGroups(args.query, args.deviceId), (res) => ({ groups: res }));
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("MCP Server Error:", error);
    process.exit(1);
});
