---
name: sendzai-agent
description: WhatsApp Automation and Orchestration Skill for AI Agents
---

# Sendzai Agent Skill

Integrate WhatsApp campaigns, session health tracking, and quick message delivery into your AI agent workflows.

## Environment Variables
- `SENDZAI_API_KEY`: Bearer API key generated from the Sendzai dashboard.
- `SENDZAI_SERVER`: Endpoint URL of the Sendzai server (default: `http://localhost:8080`).

## CLI Commands
- `sendzai configure --api-key <key> --server <url>`: Initialize the local client configuration.
- `sendzai status`: Check quotas, message limits, and WhatsApp session counts.
- `sendzai send --to <phone> --message <text>`: Send a quick message to a recipient.
- `sendzai sessions`: List connected WhatsApp session accounts.
- `sendzai campaigns`: List recent messaging campaigns.
