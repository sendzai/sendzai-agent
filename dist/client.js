import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
const IS_DEV = process.env.NODE_ENV === "development" || process.env.SENDZAI_DEV === "true";
const API_BASE_URL = IS_DEV
    ? "http://localhost:8080"
    : Buffer.from("aHR0cHM6Ly9hcGkuc2VuZHphaS5jb20=", "base64").toString("utf-8");
const CONFIG_FILE = path.join(os.homedir(), ".sendzai-agent.json");
function loadEnvFile() {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, "utf-8");
            for (const line of content.split(/\r?\n/)) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith("#")) {
                    const firstEqual = trimmed.indexOf("=");
                    if (firstEqual > 0) {
                        const key = trimmed.substring(0, firstEqual).trim();
                        const val = trimmed.substring(firstEqual + 1).trim().replace(/^['"]|['"]$/g, '');
                        if (key && !process.env[key]) {
                            process.env[key] = val;
                        }
                    }
                }
            }
        }
        catch (e) {
            // Ignore
        }
    }
}
export function loadConfig() {
    loadEnvFile();
    const config = {
        apiKey: process.env.SENDZAI_API_KEY,
        apiUrl: process.env.SENDZAI_API_URL
    };
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
            if (!config.apiKey && fileConfig.apiKey) {
                config.apiKey = typeof fileConfig.apiKey === "string" ? fileConfig.apiKey : undefined;
            }
            if (!config.apiUrl && fileConfig.apiUrl) {
                config.apiUrl = typeof fileConfig.apiUrl === "string" ? fileConfig.apiUrl : undefined;
            }
        }
        catch (e) {
            // Ignore config parse errors
        }
    }
    return config;
}
export function saveConfig(config) {
    const current = fs.existsSync(CONFIG_FILE)
        ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
        : {};
    const updated = { ...current, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
}
export function clearConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            fs.unlinkSync(CONFIG_FILE);
        }
        catch (e) {
            // Ignore
        }
    }
}
export class SendzaiClient {
    axiosInstance;
    constructor() {
        const config = loadConfig();
        if (!config.apiKey) {
            throw new Error("API Key is missing. Please run `sendzai configure --api-key <key>` or set SENDZAI_API_KEY environment variable.");
        }
        this.axiosInstance = axios.create({
            baseURL: config.apiUrl || API_BASE_URL,
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json"
            }
        });
    }
    async getStatus() {
        const response = await this.axiosInstance.get("/api/v1/agent/status");
        return response.data;
    }
    async sendMessage(to, message, mediaUrl, deviceId, fromPhone, dryRun) {
        const response = await this.axiosInstance.post("/api/v1/agent/send", {
            to,
            message,
            mediaUrl,
            deviceId,
            fromPhone,
            dryRun
        });
        return response.data;
    }
    async listWhatsAppNumbers() {
        const response = await this.axiosInstance.get("/api/v1/agent/sessions");
        return response.data;
    }
    async listCampaigns(status) {
        const response = await this.axiosInstance.get("/api/v1/agent/campaigns", {
            params: { status }
        });
        return response.data;
    }
    async scheduleMessage(payload) {
        const response = await this.axiosInstance.post("/api/v1/agent/schedule", payload);
        return response.data;
    }
    async listScheduledMessages() {
        const response = await this.axiosInstance.get("/api/v1/agent/schedule");
        return response.data;
    }
    async cancelScheduledMessage(id) {
        const response = await this.axiosInstance.delete(`/api/v1/agent/schedule/${id}`);
        return response.data;
    }
    async listRecipientLists(query) {
        const response = await this.axiosInstance.get("/api/v1/agent/lists", {
            params: { query }
        });
        return response.data;
    }
    async searchContacts(query, listId) {
        const response = await this.axiosInstance.get("/api/v1/agent/contacts", {
            params: { query, listId }
        });
        return response.data;
    }
    async searchGroups(query, whatsappNumberId) {
        const response = await this.axiosInstance.get("/api/v1/agent/groups", {
            params: { query, whatsappNumberId }
        });
        return response.data;
    }
    async postStatus(payload) {
        const response = await this.axiosInstance.post("/api/v1/agent/status-post", payload);
        return response.data;
    }
}
