import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
const CONFIG_FILE = path.join(os.homedir(), ".sendzai-agent.json");
export function loadConfig() {
    const config = {
        apiKey: process.env.SENDZAI_API_KEY,
        serverUrl: process.env.SENDZAI_SERVER || "http://localhost:8080"
    };
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
            if (!config.apiKey && fileConfig.apiKey) {
                config.apiKey = fileFileConfigApiKey(fileConfig.apiKey);
            }
            if (config.serverUrl === "http://localhost:8080" && fileConfig.serverUrl) {
                config.serverUrl = fileConfig.serverUrl;
            }
        }
        catch (e) {
            // Ignore config parse errors
        }
    }
    return config;
}
function fileFileConfigApiKey(key) {
    return typeof key === "string" ? key : undefined;
}
export function saveConfig(config) {
    const current = fs.existsSync(CONFIG_FILE)
        ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
        : {};
    const updated = { ...current, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
}
export class SendzaiClient {
    axiosInstance;
    constructor() {
        const config = loadConfig();
        if (!config.apiKey) {
            throw new Error("API Key is missing. Please run `sendzai configure` or set SENDZAI_API_KEY environment variable.");
        }
        this.axiosInstance = axios.create({
            baseURL: config.serverUrl,
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
    async sendMessage(to, message, mediaUrl, deviceId) {
        const response = await this.axiosInstance.post("/api/v1/agent/send", {
            to,
            message,
            mediaUrl,
            deviceId
        });
        return response.data;
    }
    async listWhatsAppNumbers() {
        const response = await this.axiosInstance.get("/api/v1/numbers");
        return response.data;
    }
    async listCampaigns(status) {
        const response = await this.axiosInstance.get("/api/v1/campaigns", {
            params: { status }
        });
        return response.data;
    }
}
