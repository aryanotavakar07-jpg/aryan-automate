/**
 * Main Express Web Server for Meta Lead Ads Multi-Campaign Automation
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const webhookRoutes = require("./src/routes/webhookRoutes");
const campaignRoutes = require("./src/routes/campaignRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Express Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Dashboard static files
app.use(express.static(path.join(__dirname, "public")));

// Bind API Routes
app.use(webhookRoutes);
app.use(campaignRoutes);

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "Real Estate Meta Lead Automation Server"
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n================================================================`);
    console.log(`🚀 REAL ESTATE META LEAD AUTOMATION SERVER IS RUNNING`);
    console.log(`📡 Local Access URL: http://localhost:${PORT}`);
    console.log(`📥 Meta Webhook Verification (GET): http://localhost:${PORT}/webhook`);
    console.log(`📥 Meta Webhook Event (POST):        http://localhost:${PORT}/webhook`);
    console.log(`⚙️ Dynamic Campaign Mappings API:    http://localhost:${PORT}/api/campaigns`);
    console.log(`================================================================\n`);
  });
}

module.exports = app;
