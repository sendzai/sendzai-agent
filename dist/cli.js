#!/usr/bin/env node
import { Command } from "commander";
import { saveConfig, SendzaiClient, clearConfig, loadConfig } from "./client.js";
const program = new Command();
program
    .name("sendzai")
    .description("Sendzai CLI for WhatsApp Automation & AI Agents")
    .version("1.0.5");
program
    .command("configure")
    .description("Configure Sendzai CLI with your API key (get it from settings dashboard)")
    .option("-k, --api-key <key>", "Sendzai Bearer API Key")
    .option("-s, --server <url>", "Sendzai Server Endpoint URL")
    .option("--clear", "Clear local API key configuration")
    .action((options) => {
    if (options.clear) {
        clearConfig();
        console.log(JSON.stringify({ success: true, message: "Configuration cleared." }));
        return;
    }
    if (!options.apiKey && !options.server) {
        const current = loadConfig();
        console.log(JSON.stringify(current, null, 2));
        return;
    }
    const updates = {};
    if (options.apiKey)
        updates.apiKey = options.apiKey;
    if (options.server)
        updates.apiUrl = options.server;
    saveConfig(updates);
    console.log(JSON.stringify({ success: true, message: "Configuration saved." }));
});
program
    .command("status")
    .description("Check Sendzai subscription status, quotas, and connected sessions")
    .action(async () => {
    try {
        const client = new SendzaiClient();
        const status = await client.getStatus();
        console.log(JSON.stringify(status, null, 2));
    }
    catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message || "Failed to fetch status" }, null, 2));
        process.exit(1);
    }
});
program
    .command("send")
    .description("Quick send a WhatsApp message to a phone number")
    .requiredOption("-t, --to <phone>", "Recipient phone number (normalized automatically)")
    .requiredOption("-m, --message <text>", "Message body text")
    .option("-d, --device <id>", "Pin to a specific WhatsApp number by ID (from `sendzai sessions`)")
    .option("-f, --from <phone>", "Pin to a specific WhatsApp number by phone number")
    .option("-u, --media-url <url>", "Optional public media URL (image/video/doc)")
    .option("--dry-run", "Validate inputs and preview resolution without sending", false)
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const deviceId = options.device ? parseInt(options.device, 10) : undefined;
        const result = await client.sendMessage(options.to, options.message, options.mediaUrl, deviceId, options.from, options.dryRun);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        const errMsg = e.response?.data?.message || e.message;
        console.error(JSON.stringify({ success: false, error: errMsg }, null, 2));
        process.exit(1);
    }
});
program
    .command("sessions")
    .description("List connected WhatsApp numbers and connection statuses")
    .action(async () => {
    try {
        const client = new SendzaiClient();
        const numbers = await client.listWhatsAppNumbers();
        console.log(JSON.stringify(numbers, null, 2));
    }
    catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
        process.exit(1);
    }
});
program
    .command("campaigns")
    .description("List recent campaigns")
    .option("-s, --status <status>", "Filter by status: DRAFT, RUNNING, COMPLETED, etc.")
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const result = await client.listCampaigns(options.status);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
        process.exit(1);
    }
});
program
    .command("schedule")
    .description("Schedule a WhatsApp message to be sent at a specific time")
    .requiredOption("-t, --to <phone>", "Recipient phone number")
    .requiredOption("-m, --message <text>", "Message body text")
    .requiredOption("-a, --at <datetime>", "Send time: 'yyyy-MM-dd HH:mm' or ISO-8601 (e.g. 2024-12-01T10:00:00Z)")
    .option("-z, --timezone <tz>", "Timezone (e.g. Asia/Kolkata). Defaults to your account timezone if not specified.")
    .option("-d, --device <id>", "Pin to sender device by ID")
    .option("-f, --from <phone>", "Pin to sender device by phone number")
    .option("-u, --media-url <url>", "Optional media URL")
    .option("--window-start <HH:mm>", "Delivery window start (e.g. 09:00)")
    .option("--window-end <HH:mm>", "Delivery window end (e.g. 21:00)")
    .option("--allowed-days <days>", "Comma-separated allowed days: MON,TUE,WED,THU,FRI,SAT,SUN")
    .option("--randomize", "Randomize delivery within the window", false)
    .option("--repeat-unit <unit>", "Recurrence unit: MINUTES | HOURS | DAYS | WEEKS | MONTHS | YEARS")
    .option("--repeat-interval <n>", "Repeat every N units", parseInt)
    .option("--max-repeats <n>", "Max number of times to repeat", parseInt)
    .option("--repeat-end <datetime>", "Stop repeating after this date")
    .option("--times <HH:mm,...>", "Specific times for SEVERAL type (comma-separated)")
    .option("--type <type>", "Scheduling type: DAILY | WEEKDAY | WEEKEND | WEEKLY | MONTHLY | YEARLY | HOURLY | SEVERAL | CUSTOM | INTERVAL")
    .option("--dry-run", "Validate inputs and schedule configurations without saving", false)
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const result = await client.scheduleMessage({
            to: options.to,
            message: options.message,
            sendAt: options.at,
            timezone: options.timezone,
            deviceId: options.device ? parseInt(options.device, 10) : undefined,
            fromPhone: options.from,
            mediaUrl: options.mediaUrl,
            windowStart: options.windowStart,
            windowEnd: options.windowEnd,
            allowedDays: options.allowedDays ? options.allowedDays.split(",") : undefined,
            randomizeInWindow: options.randomize,
            repeatUnit: options.repeatUnit,
            repeatInterval: options.repeatInterval,
            maxRepeats: options.maxRepeats,
            repeatEndAt: options.repeatEnd,
            specificTimes: options.times ? options.times.split(",") : undefined,
            type: options.type,
            dryRun: options.dryRun,
        });
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        const errMsg = e.response?.data?.message || e.message;
        console.error(JSON.stringify({ success: false, error: errMsg }, null, 2));
        process.exit(1);
    }
});
program
    .command("schedules")
    .description("List all agent-scheduled messages and their statuses")
    .action(async () => {
    try {
        const client = new SendzaiClient();
        const result = await client.listScheduledMessages();
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
        process.exit(1);
    }
});
program
    .command("cancel")
    .description("Cancel a pending scheduled message by ID")
    .requiredOption("-i, --id <id>", "Scheduled message ID (from `sendzai schedules`)", parseInt)
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        await client.cancelScheduledMessage(options.id);
        console.log(JSON.stringify({ success: true, message: `Scheduled message ${options.id} cancelled.` }));
    }
    catch (e) {
        const errMsg = e.response?.data?.message || e.message;
        console.error(JSON.stringify({ success: false, error: errMsg }, null, 2));
        process.exit(1);
    }
});
program.parse(process.argv);
