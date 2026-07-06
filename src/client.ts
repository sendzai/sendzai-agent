import axios, { AxiosInstance } from "axios";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface Config {
  apiKey?: string;
  serverUrl?: string;
}

const CONFIG_FILE = path.join(os.homedir(), ".sendzai-agent.json");

export function loadConfig(): Config {
  const config: Config = {
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
    } catch (e) {
      // Ignore config parse errors
    }
  }

  return config;
}

function fileFileConfigApiKey(key: any): string | undefined {
  return typeof key === "string" ? key : undefined;
}

export function saveConfig(config: Config) {
  const current = fs.existsSync(CONFIG_FILE)
    ? JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"))
    : {};
  
  const updated = { ...current, ...config };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
}

export class SendzaiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    const config = loadConfig();
    if (!config.apiKey) {
      throw new Error(
        "API Key is missing. Please run `sendzai configure` or set SENDZAI_API_KEY environment variable."
      );
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

  async sendMessage(to: string, message: string, mediaUrl?: string, deviceId?: number) {
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

  async listCampaigns(status?: string) {
    const response = await this.axiosInstance.get("/api/v1/campaigns", {
      params: { status }
    });
    return response.data;
  }
}
