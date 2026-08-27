# Git Provider Deployment Guide (GitHub ➔ Render.com)

Deploying your real estate lead automation system directly from **GitHub to Render.com**.

---

## 🚀 Option 1: Deploying Node.js Server from GitHub (Recommended)

### Step 1: Push Code to GitHub
1. Create a new repository on **GitHub** (e.g. `realestate-lead-automation`).
2. Push your project files from local workspace to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Meta Lead Automation"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/realestate-lead-automation.git
   git push -u origin main
   ```

### Step 2: Connect GitHub Repository on Render
1. Go to **[Render.com Dashboard](https://dashboard.render.com)**.
2. Click **New +** ➔ **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Connect your GitHub account and select your `realestate-lead-automation` repository.

### Step 3: Configure Render Settings
- **Name:** `realestate-lead-automation`
- **Region:** Singapore / Frankfurt
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### Step 4: Set Environment Variables
Add environment variables in the Render settings tab:

| Key | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `10000` | Render internal web port |
| `META_VERIFY_TOKEN` | `marquis_realestate_lead_secret_2026` | Meta webhook token |
| `AIRTABLE_API_KEY` | `patXXXXXXXXXXXXXX` | Airtable PAT Key |
| `AIRTABLE_BASE_ID` | `appXXXXXXXXXXXXXX` | Airtable Base ID |
| `WHATSAPP_PROVIDER` | `console` (or `meta_cloud` / `twilio`) | WhatsApp Provider |
| `WHATSAPP_ADMIN_NUMBERS` | `+919892749953,+917738382905` | Admin notification numbers |

### Step 5: Save & Deploy
1. Click **Create Web Service**.
2. Render will automatically build your repository and launch your web service.
3. Your live public URLs:
   - **Webhook URL for Meta:** `https://realestate-lead-automation.onrender.com/webhook`
   - **Dashboard URL:** `https://realestate-lead-automation.onrender.com`
   - **Health URL for UptimeRobot:** `https://realestate-lead-automation.onrender.com/health`

---

## 🐳 Option 2: Deploying n8n from GitHub via Dockerfile

If you want to host **n8n** directly from GitHub on Render:

1. Create a GitHub repo.
2. Add a `Dockerfile` with the line:
   ```dockerfile
   FROM n8nio/n8n:latest
   ```
3. On Render.com:
   - Click **New +** ➔ **Web Service** ➔ Select your Git repository.
   - **Runtime:** `Docker`
   - Environment Variables:
     - `PORT`: `10000`
     - `N8N_PORT`: `10000`
     - `N8N_HOST`: `your-app-name.onrender.com`
     - `N8N_PROTOCOL`: `https`
     - `WEBHOOK_URL`: `https://your-app-name.onrender.com/`

---

## 🔵 Meta Developer Webhook Settings

In **Meta Developers Console**:
- **Callback URL:** `https://realestate-lead-automation.onrender.com/webhook`
- **Verify Token:** `marquis_realestate_lead_secret_2026`
- **Page Field Subscription:** `leadgen`

---

## 🟠 UptimeRobot Keep-Alive (24/7 Awake)

Render free instances sleep after 15 minutes of idle time. Set up a free monitor on **[UptimeRobot.com](https://uptimerobot.com)**:
- **Monitor Type:** `HTTP(s)`
- **URL:** `https://realestate-lead-automation.onrender.com/health`
- **Interval:** `Every 5 minutes`
