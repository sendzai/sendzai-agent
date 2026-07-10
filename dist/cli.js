#!/usr/bin/env node
import { Command } from "commander";
import { saveConfig, SendzaiClient, clearConfig, loadConfig } from "./client.js";
const program = new Command();
function collectMedia(value, previous) {
    const idx = value.indexOf(":");
    if (idx === -1)
        return previous;
    const type = value.substring(0, idx);
    const url = value.substring(idx + 1);
    return previous.concat({ type, url });
}
program
    .name("sendzai")
    .description("Sendzai CLI for WhatsApp Automation & AI Agents")
    .version("1.0.9");
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
    .description("Schedule a WhatsApp message or Status update")
    .option("-t, --to <phone>", "Recipient phone number, contact name, or WhatsApp group name (required for messages)")
    .option("--status", "Schedule a WhatsApp Status/Story update instead of a message")
    .requiredOption("-m, --message <text>", "Message body text or status caption")
    .requiredOption("-a, --at <datetime>", "Send time: 'yyyy-MM-dd HH:mm' or ISO-8601 (e.g. 2024-12-01T10:00:00Z)")
    .option("-z, --timezone <tz>", "Timezone (e.g. Asia/Kolkata). Defaults to your account timezone if not specified.")
    .option("-d, --device <id>", "Pin to sender device by ID")
    .option("-f, --from <phone>", "Pin to sender device by phone number")
    .option("--media <type:url>", "Media attachment (repeatable, e.g. --media image:https://site/a.jpg)", collectMedia, [])
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
    .option("--no-all-contacts", "Restrict status visibility instead of showing to all contacts")
    .option("--jids <jids>", "Comma-separated list of explicit viewable JIDs for status updates")
    .option("--dry-run", "Validate inputs and schedule configurations without saving", false)
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const isStatus = options.status || options.to === "status@broadcast";
        const targetRecipient = isStatus ? "status@broadcast" : options.to;
        if (!isStatus && !targetRecipient) {
            console.error(JSON.stringify({ success: false, error: "Recipient option '-t, --to <phone>' is required when scheduling a message." }, null, 2));
            process.exit(1);
        }
        const result = await client.scheduleMessage({
            to: targetRecipient,
            message: options.message,
            sendAt: options.at,
            timezone: options.timezone,
            deviceId: options.device ? parseInt(options.device, 10) : undefined,
            fromPhone: options.from,
            mediaItems: options.media?.length ? options.media : undefined,
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
            allContacts: options.allContacts,
            statusJidList: options.jids ? options.jids.split(",") : undefined,
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
program
    .command("lists")
    .description("List/search your recipient contact lists")
    .option("-q, --query <search>", "Optional query search list names")
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const result = await client.listRecipientLists(options.query);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
        process.exit(1);
    }
});
program
    .command("contacts")
    .description("Search for individual contacts/recipients across list groups")
    .option("-q, --query <search>", "Optional name or phone search string")
    .option("-l, --list-id <id>", "Optional filter to restrict search to a specific contact list", parseInt)
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const result = await client.searchContacts(options.query, options.listId);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
        process.exit(1);
    }
});
program
    .command("groups")
    .description("List/search active WhatsApp groups on connected numbers")
    .option("-q, --query <search>", "Optional group name search string")
    .option("-d, --device <id>", "Optional filter to restrict search to a specific sender device/number ID", parseInt)
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const result = await client.searchGroups(options.query, options.device);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
        process.exit(1);
    }
});
program
    .command("post-status")
    .description("Post a WhatsApp Status/Story update (Text or Media)")
    .option("-m, --message <text>", "Text of the status or caption for media status")
    .option("--media <type:url>", "Media attachment (repeatable, e.g. --media image:https://site/a.jpg)", collectMedia, [])
    .option("-d, --device <id>", "Optional sender device ID", parseInt)
    .option("-f, --from <phone>", "Optional sender phone number or display name")
    .option("--no-all-contacts", "Restrict visibility instead of showing to all contacts")
    .option("--jids <jids>", "Comma-separated list of explicit viewable JIDs")
    .action(async (options) => {
    try {
        const client = new SendzaiClient();
        const result = await client.postStatus({
            message: options.message,
            mediaItems: options.media?.length ? options.media : undefined,
            deviceId: options.device,
            fromPhone: options.from,
            allContacts: options.allContacts, // Automatically true unless --no-all-contacts is specified
            statusJidList: options.jids ? options.jids.split(",") : undefined
        });
        console.log(JSON.stringify(result, null, 2));
    }
    catch (e) {
        const errMsg = e.response?.data?.message || e.message;
        console.error(JSON.stringify({ success: false, error: errMsg }, null, 2));
        process.exit(1);
    }
});
program.parse(process.argv);
