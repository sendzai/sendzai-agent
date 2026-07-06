#!/usr/bin/env node

import { Command } from "commander";
import { saveConfig, SendzaiClient } from "./client.js";

const program = new Command();

program
  .name("sendzai")
  .description("Sendzai CLI for WhatsApp Automation & AI Agents")
  .version("1.0.0");

program
  .command("configure")
  .description("Configure Sendzai CLI with server URL and API key")
  .option("-k, --api-key <key>", "Sendzai Bearer API Key")
  .option("-s, --server <url>", "Sendzai Server Endpoint", "http://localhost:8080")
  .action((options) => {
    if (!options.apiKey) {
      console.error("Error: --api-key is required.");
      process.exit(1);
    }
    saveConfig({
      apiKey: options.apiKey,
      serverUrl: options.server
    });
    console.log(JSON.stringify({ success: true, message: "Configuration saved successfully." }));
  });

program
  .command("status")
  .description("Check Sendzai subscription status, quotas, and connected sessions")
  .action(async () => {
    try {
      const client = new SendzaiClient();
      const status = await client.getStatus();
      console.log(JSON.stringify(status, null, 2));
    } catch (e: any) {
      console.error(JSON.stringify({ success: false, error: e.message || "Failed to fetch status" }, null, 2));
      process.exit(1);
    }
  });

program
  .command("send")
  .description("Quick send a WhatsApp message to a phone number")
  .requiredOption("-t, --to <phone>", "Recipient phone number (normalized automatically)")
  .requiredOption("-m, --message <text>", "Message body text")
  .option("-d, --device <id>", "Optional specific WhatsApp number device ID")
  .option("-u, --media-url <url>", "Optional public media URL (image/video/doc)")
  .action(async (options) => {
    try {
      const client = new SendzaiClient();
      const deviceId = options.device ? parseInt(options.device, 10) : undefined;
      const result = await client.sendMessage(
        options.to,
        options.message,
        options.mediaUrl,
        deviceId
      );
      console.log(JSON.stringify(result, null, 2));
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
      console.error(JSON.stringify({ success: false, error: e.message }, null, 2));
      process.exit(1);
    }
  });

program.parse(process.argv);
