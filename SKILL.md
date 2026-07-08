---
name: sendzai-agent
description: WhatsApp Automation and Orchestration Skill for AI Agents
---

# Sendzai Agent Skill

Integrate WhatsApp campaigns, session health tracking, quick message delivery, and advanced message scheduling into your AI agent workflows.

## Environment Variables
- `SENDZAI_API_KEY`: Bearer API key generated from the Sendzai dashboard.
- `SENDZAI_DEV`: Set to `true` to auto-resolve base URL to local development server (`http://localhost:8080`).

## CLI Commands

### 1. Configuration
- `sendzai configure [options]`:
  - `-k, --api-key <key>`: Save your bearer token.
  - `-s, --server <url>`: Override the default backend server (e.g. `http://localhost:8080`).
  - `--clear`: Clear local API configuration.
  - *No options:* Prints the active CLI configuration.

### 2. Status & Monitoring
- `sendzai status`: Check quotas, subscription plans, limits, and connected sessions.
- `sendzai sessions`: List connected WhatsApp session accounts and statuses (`OPEN`, etc.).
- `sendzai campaigns [options]`: List recent campaigns.
  - `-s, --status <status>`: Filter by status (`DRAFT`, `RUNNING`, `COMPLETED`, etc.).

### 3. Quick Message Delivery
- `sendzai send [options]`:
  - `-t, --to <phone_or_name>`: Recipient phone number, contact name (e.g. "Niharika"), or WhatsApp group name (e.g. "AutoSend Test Group").
  - `-m, --message <text>`: Plain text message body.
  - `-f, --from <phone_or_name>`: Optional. Pin sender by phone number or session display name (e.g. "Vexx").
  - `-d, --device <id>`: Optional. Pin sender by device ID slot.
  - `-u, --media-url <url>`: Optional. Public URL of an image/video/doc.
  - `--dry-run`: Optional. Validate numbers/names and mock send response without delivering message.

### 4. Advanced Message Scheduling
- `sendzai schedule [options]`:
  - `-t, --to <phone_or_name>`: Recipient phone number, contact name, or WhatsApp group name.
  - `-m, --message <text>`: Message body text.
  - `-a, --at <datetime>`: Target delivery date-time (ISO-8601 or `yyyy-MM-dd HH:mm`).
  - `-z, --timezone <tz>`: Timezone (e.g., `Asia/Kolkata`). Defaults to the user's account timezone if not specified.
  - `-f, --from <phone_or_name>`: Optional. Pin sender by phone number or session display name.
  - `-d, --device <id>`: Optional. Pin sender by device ID.
  - `-u, --media-url <url>`: Optional. Public media URL.
  - `--window-start <HH:mm>`: Optional. Delivery window start (e.g., `09:00`).
  - `--window-end <HH:mm>`: Optional. Delivery window end (e.g., `21:00`).
  - `--allowed-days <days>`: Optional. Comma-separated days (e.g., `MON,TUE,WED,THU,FRI`).
  - `--randomize`: Optional. Randomize delivery within the window.
  - `--repeat-unit <unit>`: Recurrence unit: `MINUTES` | `HOURS` | `DAYS` | `WEEKS` | `MONTHS` | `YEARLY`.
  - `--repeat-interval <n>`: Repeat interval value.
  - `--max-repeats <n>`: Max repeat occurrences.
  - `--repeat-end <datetime>`: Timestamp to stop repeating.
  - `--times <HH:mm,...>`: Comma-separated times for `SEVERAL` schedule type.
  - `--type <type>`: Scheduling type: `DAILY` | `WEEKDAY` | `WEEKEND` | `WEEKLY` | `MONTHLY` | `YEARLY` | `HOURLY` | `SEVERAL` | `CUSTOM` | `INTERVAL`.
  - `--dry-run`: Optional. Validate scheduling config and mock response without creating database schedule.
- `sendzai schedules`: List all agent-scheduled messages and statuses.
- `sendzai cancel [options]`: Cancel a pending schedule.
  - `-i, --id <id>`: Target scheduled message ID.
