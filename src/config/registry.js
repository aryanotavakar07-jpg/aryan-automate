/**
 * Multi-Form & Campaign Routing Registry
 * 
 * Maps Meta Form IDs strictly to Campaign Names and their specific Airtable CRM Tables.
 */

// Initial default registry containing strictly configured forms
const defaultRegistry = {
  "1044971085049692": {
    campaignName: "Silver Saphire",
    tableName: "Silver Saphire"
  },
  "900221056143338": {
    campaignName: "Navkarmik",
    tableName: "Navkarmik"
  }
};

// In-memory dynamic mapping state
const activeRegistry = { ...defaultRegistry };

/**
 * Resolves Campaign Name and Airtable Target Table from Meta Form ID
 * @param {string|number} formId - Meta Lead Ad Form ID
 * @returns {{ campaignName: string, tableName: string, isRegistered: boolean }}
 */
function resolveCampaign(formId) {
  const normalizedFormId = String(formId || "").trim();

  if (normalizedFormId && activeRegistry[normalizedFormId]) {
    return {
      formId: normalizedFormId,
      campaignName: activeRegistry[normalizedFormId].campaignName,
      tableName: activeRegistry[normalizedFormId].tableName,
      isRegistered: true
    };
  }

  return {
    formId: normalizedFormId || "Unknown",
    campaignName: null,
    tableName: null,
    isRegistered: false
  };
}

/**
 * Registers or updates a Form ID mapping dynamically
 * @param {string} formId 
 * @param {string} campaignName 
 * @param {string} tableName 
 */
function registerFormMapping(formId, campaignName, tableName) {
  const normalizedFormId = String(formId || "").trim();
  if (!normalizedFormId) {
    throw new Error("Form ID is required for registry mapping");
  }

  activeRegistry[normalizedFormId] = {
    campaignName: campaignName || `Campaign (Form ${normalizedFormId})`,
    tableName: tableName || "Leads"
  };

  return activeRegistry[normalizedFormId];
}

/**
 * Returns all active form mappings
 */
function getAllMappings() {
  return { ...activeRegistry };
}

/**
 * Removes a form mapping from the active registry
 * @param {string} formId 
 */
function deleteFormMapping(formId) {
  const normalizedFormId = String(formId || "").trim();
  if (activeRegistry[normalizedFormId]) {
    delete activeRegistry[normalizedFormId];
    return true;
  }
  return false;
}

/**
 * Resets registry to default configuration
 */
function resetRegistry() {
  Object.keys(activeRegistry).forEach(key => delete activeRegistry[key]);
  Object.assign(activeRegistry, defaultRegistry);
  return getAllMappings();
}

module.exports = {
  resolveCampaign,
  registerFormMapping,
  getAllMappings,
  deleteFormMapping,
  resetRegistry,
  defaultRegistry
};
