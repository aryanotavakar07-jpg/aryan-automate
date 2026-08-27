/**
 * Campaign-Specific Airtable CRM Insertion Service
 * 
 * Inserts parsed lead records strictly into the targeted campaign's table.
 */

const axios = require("axios");

// Audit log store for local inspection & testing
const leadRecordsLog = [];

/**
 * Inserts a lead record into Airtable CRM under the designated table name
 * 
 * @param {string} tableName - Target Airtable table name (e.g., "Silver Saphire", "Navkarmik", "Leads")
 * @param {Object} leadData - Extracted lead fields
 * @returns {Promise<Object>} Created record response
 */
async function insertLeadToAirtable(tableName, leadData) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const targetTable = tableName || "Leads";

  const recordFields = {
    "Name": leadData.fullName,
    "Phone Number": `+${leadData.phoneNumber}`,
    "Property Type": leadData.propertyType,
    "Status": "New"
  };

  const auditEntry = {
    id: `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    tableName: targetTable,
    fields: recordFields,
    timestamp: new Date().toISOString(),
    isMock: !apiKey || !baseId
  };

  // Log in internal audit log
  leadRecordsLog.unshift(auditEntry);

  // If credentials are missing, perform graceful local simulation
  if (!apiKey || !baseId || apiKey === "patXXXXXXXXXXXXXX" || baseId === "appXXXXXXXXXXXXXX") {
    console.log(`[Airtable Service] [MOCK MODE] Inserting record into Table '${targetTable}':`, recordFields);
    return {
      success: true,
      isMock: true,
      recordId: auditEntry.id,
      tableName: targetTable,
      fields: recordFields,
      message: `Lead saved to Table '${targetTable}' (Mock Mode - Configure AIRTABLE_API_KEY & AIRTABLE_BASE_ID in .env for live sync)`
    };
  }

  // Live Sync via Airtable REST API
  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(targetTable)}`;
    const response = await axios.post(
      url,
      { fields: recordFields },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`[Airtable Service] Successfully created record in Table '${targetTable}' (ID: ${response.data.id})`);

    return {
      success: true,
      isMock: false,
      recordId: response.data.id,
      tableName: targetTable,
      fields: response.data.fields
    };
  } catch (error) {
    const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Airtable Service] Error inserting into Table '${targetTable}':`, errorDetails);

    // Return structured failure response without crashing the application
    return {
      success: false,
      isMock: false,
      error: errorDetails,
      tableName: targetTable,
      fallbackAuditId: auditEntry.id,
      message: `Failed to insert record into Airtable Table '${targetTable}'. Saved to local audit log.`
    };
  }
}

/**
 * Returns recent lead insertion logs
 */
function getRecentLeadLogs(limit = 50) {
  return leadRecordsLog.slice(0, limit);
}

module.exports = {
  insertLeadToAirtable,
  getRecentLeadLogs
};
