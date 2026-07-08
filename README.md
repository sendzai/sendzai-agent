# Sendzai Agent CLI & SDK

An automated WhatsApp messaging orchestrator and CLI utility for human operators and AI Agent workflows. Connect your slots, manage campaigns, resolve contact & group names dynamically, and schedule recurring messages with complex business rules.

---

## Features

- 🚀 **Quick Send:** Dispatch messages to individual phone numbers, WhatsApp Group JIDs, saved contact names, or synced WhatsApp group names.
- 📅 **Advanced Scheduling:** Schedule messages with flexible recurrence rules, allowed delivery windows (e.g. 09:00 - 21:00), allowed days of the week, and anti-ban delivery time randomization.
- 🔍 **Dynamic Resolution:** Resolve sender/recipient names dynamically using fast PostgreSQL composite indexes.
- 🧪 **Dry-Run Mode:** Validate configurations, timezones, and lookup targets with `--dry-run` without sending messages or writing to the database.
- 🤖 **AI-Agent Ready:** Integrates easily into agent frameworks (LangChain, AutoGen, Claude Code, Cursor, Codex, Amp) via stdio MCP or standard Node SDK.

---

## Installation

Install the CLI globally on your system:
```bash
npm install -g @sendzai/agent
```

---

## Configuration

Set up your authorization key from your Sendzai Dashboard:
```bash
# Save your bearer key locally
sendzai configure --api-key szai_4c236621...

# Inspect the active configuration setup
sendzai configure
```

---

## CLI Reference

### 1. Monitor Account Status
Check your active plan limits, remaining message quota, and connected WhatsApp sessions:
```bash
sendzai status
```

### 2. Quick Send
Deliver text or media messages instantly. 

#### A. Using Direct Phone Numbers & Auto-Selected Sender
```bash
# Send directly to a normalized phone number
sendzai send -t "+15558675309" -m "Hello John!"
```

#### B. Using Contact Names & Session Display Names
```bash
# Resolve contact name "John Doe" and sender slot name "Sales" dynamically
sendzai send -t "John Doe" -f "Sales" -m "Hi John! Sent from our Sales channel."
```

#### C. Using WhatsApp Group Names & Specific Device Slot IDs
```bash
# Resolve WhatsApp Group "Sendzai" and send from device slot ID 4
sendzai send -t "Sendzai" -d 4 -m "Hi Team!"
```

#### D. Dry-Run Verification
```bash
# Validate name lookups and connection status without sending
sendzai send -t "John Doe" -m "Test check" --dry-run
```

---

### 3. Schedule Messages
Schedule one-time or recurring campaigns.

#### A. One-Time Scheduling (Using Names)
```bash
# Schedule for a specific local time resolved to "John Doe" via "Sales" channel
sendzai schedule -t "John Doe" -f "Sales" -m "Good morning!" -a "2026-07-07 09:00" -z "Asia/Kolkata"
```

#### B. One-Time Scheduling (Using Phone Numbers)
```bash
# Schedule directly using raw phone numbers
sendzai schedule -t "+15558675309" -f "+15551234567" -m "Raw number schedule" -a "2026-07-07T09:00:00Z"
```

#### C. Advanced Recurring Scheduling (Using Group Name)
```bash
# Schedule an hourly recurring message to a WhatsApp Group with restricted delivery window and dry-run check
sendzai schedule -t "Sendzai" \
  -m "Hourly heartbeat report" \
  -a "2026-07-07 08:00" \
  --window-start "09:00" \
  --window-end "21:00" \
  --allowed-days "MON,TUE,WED,THU,FRI" \
  --repeat-unit "HOURS" \
  --repeat-interval 1 \
  --dry-run
```

### 4. Manage Schedules
List pending agent campaigns or cancel a scheduled slot:
```bash
# List all scheduled campaigns
sendzai schedules

# Cancel a campaign by its ID
sendzai cancel --id 174
```

---

## Programmatic SDK Usage

You can also import `SendzaiClient` programmatically inside your Node/TypeScript projects:

```typescript
import { SendzaiClient } from "@sendzai/agent";

const client = new SendzaiClient();

// Send quick message
const result = await client.sendMessage(
  "John Doe", 
  "Hello John!", 
  undefined, // mediaUrl
  undefined, // deviceId
  "Sales"     // fromPhone display name
);

console.log("Sent successfully:", result);
```

---

> [!IMPORTANT]
> To use this agent, you need a **Sendzai Account** and a **Pro Subscription**.
> Please visit our website at [sendzai.com](https://sendzai.com) to sign up and configure your account.
