/**
 * Dynamic Field Extractor (Question-Agnostic)
 * 
 * Inspects field_data arrays or key-value objects from Meta Lead Ads payloads
 * without relying on hardcoded question text.
 */

/**
 * Main extraction entrypoint
 * @param {Object} rawPayload - Raw webhook payload or graph API payload
 * @returns {Object} Extracted & normalized lead data
 */
function extractLeadData(rawPayload = {}) {
  // Extract lead identifier
  const leadId = rawPayload.leadgen_id || rawPayload.id || rawPayload.lead_id || Date.now().toString().slice(-6);

  // Normalize input fields into standard [{ name, value }] list
  const fields = normalizeFields(rawPayload);

  // Extract core fields
  const phoneNumber = extractPhone(fields);
  const fullName = extractFullName(fields, leadId);
  const propertyType = extractConfiguration(fields);

  return {
    leadId,
    fullName,
    phoneNumber,
    propertyType,
    rawFields: fields
  };
}

/**
 * Normalizes field_data array or flat payload object into uniform [{ name, value }] array
 */
function normalizeFields(rawPayload) {
  const fields = [];

  // Case 1: Standard Meta field_data array [{ name: "full_name", values: ["John"] }]
  if (Array.isArray(rawPayload.field_data)) {
    for (const item of rawPayload.field_data) {
      const name = String(item.name || item.name_raw || "").trim();
      const val = Array.isArray(item.values) ? item.values.join(", ").trim() : String(item.values || "").trim();
      if (name || val) {
        fields.push({ name, value: val });
      }
    }
  }

  // Case 2: Object key-value pairs
  if (fields.length === 0 && typeof rawPayload === "object" && rawPayload !== null) {
    const reservedKeys = ["leadgen_id", "form_id", "page_id", "created_time", "ad_id", "adset_id", "campaign_id"];
    for (const [key, value] of Object.entries(rawPayload)) {
      if (!reservedKeys.includes(key) && value !== undefined && value !== null) {
        const valStr = Array.isArray(value) ? value.join(", ") : String(value);
        fields.push({ name: key, value: valStr });
      }
    }
  }

  return fields;
}

/**
 * Normalizes phone numbers to international 12-digit Indian format (91XXXXXXXXXX)
 */
function extractPhone(fields) {
  let rawPhone = "";

  // 1. Search for fields explicitly containing phone, mobile, contact, num
  for (const f of fields) {
    const nameLower = f.name.toLowerCase();
    if (nameLower.includes("phone") || nameLower.includes("mobile") || nameLower.includes("contact") || nameLower.includes("number")) {
      rawPhone = f.value;
      break;
    }
  }

  // 2. Fallback: inspect any field value that looks like phone digits
  if (!rawPhone) {
    for (const f of fields) {
      const digitsOnly = f.value.replace(/\D/g, "");
      if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
        rawPhone = f.value;
        break;
      }
    }
  }

  // Clean all non-digit characters
  let digits = String(rawPhone || "").replace(/\D/g, "");

  // If we have at least 10 digits, look for the 10-digit Indian mobile number (starts with 6, 7, 8, 9)
  const mobileMatch = digits.match(/[6-9]\d{9}$/);
  if (mobileMatch) {
    return "91" + mobileMatch[0];
  }

  // Fallback formatting if exact 10-digit pattern match is not found
  if (digits.length === 10) {
    digits = "91" + digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    // Keep 91XXXXXXXXXX
  } else if (digits.length > 12 && digits.startsWith("91")) {
    digits = digits.slice(0, 12);
  } else if (digits.length === 0) {
    digits = "910000000000";
  }

  return digits;
}

/**
 * Extracts Full Name, fallback to FB Prospect (#<lead_id>) if missing/dummy
 */
function extractFullName(fields, leadId) {
  let candidateName = "";

  // Look for name-related field names
  for (const f of fields) {
    const nameLower = f.name.toLowerCase();
    if (
      nameLower.includes("full_name") ||
      nameLower.includes("full name") ||
      nameLower.includes("name") ||
      nameLower.includes("first_name") ||
      nameLower.includes("prospect")
    ) {
      candidateName = f.value.trim();
      break;
    }
  }

  // Fallback: search for first non-phone, non-configuration text field
  if (!candidateName) {
    for (const f of fields) {
      const val = f.value.trim();
      const valLower = val.toLowerCase();
      if (
        val.length > 1 &&
        !/\d{8,}/.test(val) &&
        !valLower.includes("bhk") &&
        !valLower.includes("jodi")
      ) {
        candidateName = val;
        break;
      }
    }
  }

  // Filter dummy / test values
  const dummyTerms = ["test", "dummy", "n/a", "none", "no name", "unknown", "asdf", "fb prospect"];
  const isDummy = !candidateName || dummyTerms.some(term => candidateName.toLowerCase() === term);

  if (isDummy) {
    return `FB Prospect (#${leadId})`;
  }

  return candidateName;
}

/**
 * Extracts Property Configuration (1 BHK, 2 BHK, 3 BHK, 4 BHK, Jodi Option, etc.)
 */
function extractConfiguration(fields) {
  for (const f of fields) {
    const nameLower = f.name.toLowerCase();
    const valLower = f.value.toLowerCase();
    const combined = `${f.name} ${f.value}`.toLowerCase();
    
    // Check Jodi Option
    if (valLower.includes("jodi") || combined.includes("jodi")) {
      return "JODI OPTION";
    }

    // Check BHK pattern
    const bhkMatch = f.value.match(/(\d\s*[\/\-&]?\s*\d*|\d+)\s*bhk/i) || combined.match(/(\d\s*[\/\-&]?\s*\d*|\d+)\s*bhk/i);
    if (bhkMatch) {
      return bhkMatch[0].toUpperCase().replace(/\s+/g, " ");
    }

    if (combined.includes("studio")) return "Studio";
    if (combined.includes("penthouse")) return "Penthouse";
    if (combined.includes("villa")) return "Villa";
    if (combined.includes("duplex")) return "Duplex";

    // Matching exact or partial configuration questions
    if (nameLower.includes("configuration") || nameLower.includes("unit") || nameLower.includes("flat") || nameLower.includes("looking for")) {
      if (f.value) return f.value.trim();
    }
  }

  // Fallback configuration if not explicitly stated in payload
  return "2 BHK";
}

module.exports = {
  extractLeadData,
  extractPhone,
  extractFullName,
  extractConfiguration
};
