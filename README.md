# Sendzai Agent CLI & SDK

An automated WhatsApp messaging orchestrator and CLI utility for human operators and AI Agent workflows. Connect your slots, manage campaigns, resolve contact & group names dynamically, schedule recurring messages, and post WhatsApp Status/Stories with complex business rules.

---

## Features

- 🚀 **Quick Send:** Dispatch messages to individual phone numbers, WhatsApp Group JIDs, saved contact names, or synced WhatsApp group names.
- 📅 **Advanced Scheduling:** Schedule messages and status updates with flexible recurrence rules, delivery windows (e.g. 09:00–21:00), allowed days, and anti-ban randomization.
- 📸 **Multi-Media Status:** Post multiple image/video WhatsApp stories in one command — each item is posted sequentially.
- 🔍 **Dynamic Resolution:** Resolve sender/recipient names dynamically using fast PostgreSQL composite indexes (exact match first, falls back to partial).
- 🧪 **Dry-Run Mode:** Validate configurations, timezones, and lookup targets with `--dry-run` without sending or writing to the database.
- 🤖 **AI-Agent Ready:** Integrates easily into agent frameworks (LangChain, AutoGen, Claude, Cursor, Codex, Amp) via stdio MCP or standard Node SDK.

---

## Installation

```bash
npm install -g @sendzai/agent
```

---

## Configuration

```bash
# Save your bearer key locally
sendzai configure --api-key szai_4c236621...

# Inspect the active configuration
sendzai configure
```

---

## CLI Reference

### 1. Monitor Account Status
```bash
sendzai status
```

---

### 2. Quick Send

#### A. Phone Number & Auto-Selected Sender
```bash
sendzai send -t "+15558675309" -m "Hello John!"
```

#### B. Contact Name & Session Display Name
```bash
sendzai send -t "John Doe" -f "Sales" -m "Hi John! Sent from our Sales channel."
```

#### C. WhatsApp Group Name & Specific Device Slot
```bash
sendzai send -t "Sendzai" -d 4 -m "Hi Team!"
```

#### D. With Media Attachment
```bash
sendzai send -t "+15558675309" -m "Check this out!" -u "https://example.com/image.jpg"
```

#### E. Dry-Run Verification
```bash
sendzai send -t "John Doe" -m "Test check" --dry-run
```

---

### 3. Schedule Messages

All scheduled messages and status updates support the `--media` flag for structured media attachments.

#### Media Flag Format
```
--media <type>:<url>
```
- `type` must be `image` or `video`
- Flag is **repeatable** — pass it multiple times to attach multiple items

#### A. One-Time Schedule (Direct Message)
```bash
sendzai schedule -t "John Doe" -f "Sales" -m "Good morning!" -a "2026-07-07 09:00" -z "Asia/Kolkata"
```

#### B. Schedule with Media Attachments
```bash
sendzai schedule -t "+15558675309" \
  -m "Check out these shots!" \
  --media image:https://example.com/photo1.jpg \
  --media image:https://example.com/photo2.jpg \
  -a "2026-07-12 09:00" -z "Asia/Kolkata"
```

#### C. Recurring Schedule with Delivery Window
```bash
sendzai schedule -t "Sendzai" \
  -m "Hourly heartbeat" \
  -a "2026-07-07 08:00" \
  --window-start "09:00" \
  --window-end "21:00" \
  --allowed-days "MON,TUE,WED,THU,FRI" \
  --repeat-unit "HOURS" \
  --repeat-interval 1 \
  --dry-run
```

#### D. Schedule WhatsApp Status Update (Text)
```bash
sendzai schedule --status -m "Scheduled morning update!" -a "2026-07-11 09:00" -z "Asia/Kolkata"
```

#### E. Schedule WhatsApp Status with Media
```bash
sendzai schedule --status \
  -m "Weekend vibes 🌅" \
  --media image:https://picsum.photos/seed/sunrise/800/600 \
  -a "2026-07-12 08:00" -z "Asia/Kolkata"
```

---

### 4. Manage Schedules
```bash
# List all scheduled campaigns
sendzai schedules

# Cancel a campaign by ID
sendzai cancel --id 174
```

---

### 5. Lookups & Searching

#### A. Recipient Contact Lists
```bash
sendzai lists
sendzai lists --query "Customers"
```

#### B. Search Contacts
Prioritizes exact case-insensitive matches, falls back to partial contains.
```bash
sendzai contacts
sendzai contacts --query "John Doe"
sendzai contacts --query "John" --list-id 4
```

#### C. Search WhatsApp Groups
```bash
sendzai groups
sendzai groups --query "Sales"
sendzai groups --query "Sales" --device 43
```

---

### 6. WhatsApp Status Posting

Post text or structured media stories to your WhatsApp Status. Visible to all contacts by default.

#### A. Text Status
```bash
sendzai post-status -m "Working on something exciting 🚀"
```

#### B. Single Image Status
```bash
sendzai post-status -m "Beautiful morning!" \
  --media image:https://picsum.photos/seed/morning/800/600
```

#### C. Multiple Images / Videos (Posted Sequentially)
```bash
sendzai post-status -m "Weekend highlights 📸" \
  --media image:https://picsum.photos/seed/alpha/800/600 \
  --media image:https://picsum.photos/seed/beta/800/600 \
  --media video:https://example.com/clip.mp4
```

#### D. Custom Viewers List (JIDs)
```bash
sendzai post-status -m "Internal update" \
  --no-all-contacts \
  --jids "917821876667@s.whatsapp.net,120363028436768532@g.us"
```

---

## Programmatic SDK Usage

```typescript
import { SendzaiClient } from "@sendzai/agent";

const client = new SendzaiClient();

// 1. Send a quick message
await client.sendMessage("John Doe", "Hello!", undefined, undefined, "Sales");

// 2. Post a multi-media status
await client.postStatus({
  message: "Weekend highlights 📸",
  mediaItems: [
    { url: "https://picsum.photos/seed/alpha/800/600", type: "image" },
    { url: "https://picsum.photos/seed/beta/800/600",  type: "image" },
  ],
  allContacts: true
});

// 3. Schedule a message with media
await client.scheduleMessage({
  to: "+15558675309",
  message: "Check this out!",
  sendAt: "2026-07-12 09:00",
  timezone: "Asia/Kolkata",
  mediaItems: [
    { url: "https://example.com/photo.jpg", type: "image" }
  ]
});
```

---

> [!IMPORTANT]
> To use this agent, you need a **Sendzai Account** and a **Pro Subscription**.
> Please visit our website at [sendzai.com](https://sendzai.com) to sign up and configure your account.
