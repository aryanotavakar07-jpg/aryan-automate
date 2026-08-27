# Meta Real Estate Lead Automation System (Node.js & n8n)

A multi-campaign real estate lead automation platform built with Node.js and n8n. It ingests Meta (Facebook & Instagram) Lead Ads webhooks, dynamically identifies Campaign & Form IDs, parses lead fields (`Full name`, `Phone number`, `WHICH CONFIGURATION ARE YOU LOOKING FOR?`), routes lead records strictly into campaign-designated Airtable CRM tables, and dispatches branded WhatsApp admin alerts.

---

## 🎯 Features

- **Multi-Form Campaign Routing Registry:** Connects Meta Form IDs to specific Campaign Names and designated Airtable CRM Tables.
- **Question-Agnostic Dynamic Field Extractor:**
  - **Phone Normalization:** Converts Indian phone numbers (`+91`, `0`, 10 digits) to 12-digit international format (`91XXXXXXXXXX`).
  - **Full Name:** Extract lead name, fallback to `FB Prospect (#<lead_id>)` if missing/dummy.
  - **Property Configuration:** Extracts `1 BHK`, `2 BHK`, `3 BHK`, `4 BHK`, or `JODI OPTION`.
- **Campaign-Specific Airtable CRM Router:** Direct dynamic insertion into campaign tables (`Silver Saphire`, `Navkarmik`, etc.).
- **Branded WhatsApp Alert Engine:** Instant notifications to Admin numbers (`+919892749953`, `+917738382905`) with exact alert template.
- **Interactive UI Dashboard & Simulator:** Web UI at `http://localhost:3000` to test webhooks and inspect execution logs.
- **n8n Workflow Export:** Ready-to-import `n8n_lead_automation_workflow.json`.

---

## 📥 1. Multi-Form & Campaign Routing Registry

| Meta Form ID | Campaign Name | Target Airtable Table |
| :--- | :--- | :--- |
| `1044971085049692` | `Silver Saphire` | `Silver Saphire` |
| `900221056143338` | `Navkarmik` | `Navkarmik` |
| *Unknown / New Form IDs* | `Campaign (Form <form_id>)` | `Leads` |

---

## 📱 2. WhatsApp Admin Alert Format

```text
🚨 *NEW LEAD RECEIVED* 🚨

📋 *Campaign Name:* Silver Saphire
📌 *Meta Form ID:* 1044971085049692

👤 *Customer Name:* Rajesh Sharma
📱 *Phone Number:* +919892749953
🏢 *Configuration:* 3 BHK
📁 *Saved To Table:* Silver Saphire
```

---

## 🚀 Quick Start (Node.js)

### 1. Installation
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in credentials:
```env
PORT=3000
META_VERIFY_TOKEN=marquis_realestate_lead_secret_2026

# Airtable Credentials
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# WhatsApp Configuration (console | meta_cloud | twilio | ultramsg)
WHATSAPP_PROVIDER=console
WHATSAPP_ADMIN_NUMBERS=+919892749953,+917738382905
```

### 3. Start the Server & Web Dashboard
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

### Unit & Integration Test Suite
```bash
npm test
```

### Webhook Execution Test with Sample Payloads
```bash
npm run test:webhook
```

---

## ⚙️ n8n Import Guide

1. Open your n8n instance dashboard.
2. Click **Workflows** ➔ **Import from File**.
3. Select `n8n_lead_automation_workflow.json`.
4. Configure your Airtable Base credentials and Meta/WhatsApp API node parameters.
5. Activate the workflow!

---

## 🗄️ Airtable Table Setup

Ensure your Airtable Base contains the following tables:
- Table 1: `Silver Saphire`
- Table 2: `Navkarmik`
- Fallback Table: `Leads`

Columns required in each table:
- `Name` (Single line text)
- `Phone Number` (Single line text / Phone)
- `Property Type` (Single line text / Single select)
- `Status` (Single select: `"New"`)
