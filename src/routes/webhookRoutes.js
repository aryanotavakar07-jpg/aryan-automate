/**
 * Meta Lead Ads Webhook Router
 * 
 * Handles Meta Webhook verification (GET /webhook), lead event reception (POST /webhook),
 * and manual testing simulation endpoints with strict Form ID filtering.
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const { resolveCampaign } = require("../config/registry");
const { extractLeadData } = require("../services/fieldExtractor");
const { insertLeadToAirtable, getRecentLeadLogs } = require("../services/airtableService");
const { sendWhatsAppAlert, getRecentAlertLogs } = require("../services/whatsappService");

// Processed webhook activity memory log
const processedEvents = [];

/**
 * Meta Webhook Verification Endpoint (GET /webhook)
 */
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expectedToken = process.env.META_VERIFY_TOKEN || "marquis_realestate_lead_secret_2026";

  if (mode && token) {
    if (mode === "subscribe" && token === expectedToken) {
      console.log("[Webhook GET] Webhook verification challenge passed successfully!");
      return res.status(200).send(challenge);
    } else {
      console.warn("[Webhook GET] Verification failed. Token mismatch.");
      return res.sendStatus(403);
    }
  }

  res.status(200).json({
    status: "online",
    message: "Meta Lead Ads Webhook endpoint is operational",
    verifyTokenConfigured: Boolean(process.env.META_VERIFY_TOKEN)
  });
});

/**
 * Meta Lead Webhook Handler (POST /webhook)
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("[Webhook POST] Received webhook notification payload:", JSON.stringify(req.body, null, 2));

    const payload = req.body || {};
    const leadEntries = extractEntriesFromPayload(payload);

    if (leadEntries.length === 0) {
      // If direct single payload passed
      const result = await processLeadPayload(payload);
      return res.status(200).json(result);
    }

    const results = [];
    for (const entry of leadEntries) {
      const result = await processLeadPayload(entry);
      results.push(result);
    }

    return res.status(200).json({
      status: "success",
      count: results.length,
      processed: results
    });
  } catch (error) {
    console.error("[Webhook POST] Error processing webhook:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

/**
 * Test Endpoint for Manual Simulation (POST /api/lead-test)
 */
router.post("/api/lead-test", async (req, res) => {
  try {
    const payload = req.body || {};
    console.log("[Test Endpoint] Triggering manual test lead submission:", payload);
    const result = await processLeadPayload(payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[Test Endpoint] Error executing manual test lead:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

/**
 * Returns recent processed lead events log
 */
router.get("/api/logs", (req, res) => {
  res.status(200).json({
    processedEvents: processedEvents.slice(0, 50),
    airtableLogs: getRecentLeadLogs(50),
    whatsappLogs: getRecentAlertLogs(50)
  });
});

/**
 * Main Lead Processor Pipeline with Strict Form ID Filtering
 */
async function processLeadPayload(leadPayload) {
  // Extract Form ID
  let formId = leadPayload.form_id || leadPayload.formId;
  let rawLeadData = leadPayload;

  // Handle Meta Graph API fetch if only leadgen_id is passed without field_data
  const leadgenId = leadPayload.leadgen_id || leadPayload.lead_id;
  const graphToken = process.env.META_GRAPH_TOKEN;

  if (leadgenId && (!leadPayload.field_data || leadPayload.field_data.length === 0) && graphToken) {
    try {
      console.log(`[Meta Graph API] Fetching details for leadgen_id: ${leadgenId}`);
      const graphRes = await axios.get(`https://graph.facebook.com/v18.0/${leadgenId}`, {
        params: { access_token: graphToken }
      });
      if (graphRes.data) {
        rawLeadData = graphRes.data;
        formId = graphRes.data.form_id || formId;
      }
    } catch (graphErr) {
      console.warn(`[Meta Graph API] Warning: Failed to fetch lead details via Graph API:`, graphErr.message);
    }
  }

  // 1. Strict Multi-Form Registry Check
  const campaignInfo = resolveCampaign(formId);
  if (!campaignInfo.isRegistered) {
    console.log(`[Filter Ignored] Ignored lead from Form ID '${formId}' because it is not in the registered campaign list.`);
    return {
      status: "ignored",
      message: `Form ID ${formId} is not in registered active campaign forms list. Lead ignored.`,
      formId
    };
  }

  console.log(`[Campaign Registry] Resolved Form ID '${campaignInfo.formId}' -> Campaign '${campaignInfo.campaignName}' -> Target Table '${campaignInfo.tableName}'`);

  // 2. Dynamic Field Extractor (Question-Agnostic)
  const leadData = extractLeadData(rawLeadData);
  console.log(`[Dynamic Extractor] Extracted Lead:`, {
    Name: leadData.fullName,
    Phone: leadData.phoneNumber,
    Config: leadData.propertyType
  });

  // 3. Campaign-Specific Airtable CRM Insertion
  const airtableResult = await insertLeadToAirtable(campaignInfo.tableName, leadData);

  // 4. Campaign-Branded WhatsApp Alert Dispatcher
  const whatsappResult = await sendWhatsAppAlert(campaignInfo, leadData);

  const eventSummary = {
    eventId: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    status: "processed",
    campaignInfo,
    leadData,
    airtableResult,
    whatsappResult
  };

  processedEvents.unshift(eventSummary);

  return eventSummary;
}

/**
 * Helper to unwrap nested Meta webhook JSON structure
 */
function extractEntriesFromPayload(payload) {
  const entries = [];
  if (payload.object === "page" && Array.isArray(payload.entry)) {
    for (const pageEntry of payload.entry) {
      if (Array.isArray(pageEntry.changes)) {
        for (const change of pageEntry.changes) {
          if (change.field === "leadgen" && change.value) {
            entries.push(change.value);
          }
        }
      }
    }
  }
  return entries;
}

module.exports = router;
