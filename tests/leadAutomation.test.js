/**
 * Automated Unit & Integration Tests for Meta Lead Ads Multi-Campaign Automation
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveCampaign } = require("../src/config/registry");
const {
  extractPhone,
  extractFullName,
  extractConfiguration
} = require("../src/services/fieldExtractor");
const { formatWhatsAppAlert } = require("../src/services/whatsappService");

test("1. Multi-Form & Campaign Routing Registry (Strict Filter)", async (t) => {
  await t.test("Resolves Form 1044971085049692 to Silver Saphire Campaign and Silver Saphire Table", () => {
    const campaign = resolveCampaign("1044971085049692");
    assert.equal(campaign.campaignName, "Silver Saphire");
    assert.equal(campaign.tableName, "Silver Saphire");
    assert.equal(campaign.isRegistered, true);
  });

  await t.test("Resolves Form 900221056143338 to Navkarmik Campaign and Navkarmik Table", () => {
    const campaign = resolveCampaign("900221056143338");
    assert.equal(campaign.campaignName, "Navkarmik");
    assert.equal(campaign.tableName, "Navkarmik");
    assert.equal(campaign.isRegistered, true);
  });

  await t.test("Rejects Unknown Form ID with isRegistered: false", () => {
    const campaign = resolveCampaign("999888777");
    assert.equal(campaign.campaignName, null);
    assert.equal(campaign.tableName, null);
    assert.equal(campaign.isRegistered, false);
  });
});

test("2. Dynamic Field Extractor - Phone Number Normalization", async (t) => {
  await t.test("Normalizes +91 formatted numbers", () => {
    const fields = [{ name: "Phone number", value: "+91 98927 49953" }];
    const phone = extractPhone(fields);
    assert.equal(phone, "919892749953");
  });

  await t.test("Normalizes leading 0 numbers", () => {
    const fields = [{ name: "Phone number", value: "097738382905" }];
    const phone = extractPhone(fields);
    assert.equal(phone, "917738382905");
  });

  await t.test("Normalizes raw 10-digit Indian numbers", () => {
    const fields = [{ name: "Phone number", value: "9820011223" }];
    const phone = extractPhone(fields);
    assert.equal(phone, "919820011223");
  });
});

test("3. Dynamic Field Extractor - Full Name & Fallbacks", async (t) => {
  await t.test("Extracts valid customer name", () => {
    const fields = [{ name: "Full name", value: "Rajesh Sharma" }];
    const name = extractFullName(fields, "12345");
    assert.equal(name, "Rajesh Sharma");
  });

  await t.test("Applies FB Prospect (#lead_id) fallback for dummy terms", () => {
    const fields = [{ name: "Full name", value: "test" }];
    const name = extractFullName(fields, "998877");
    assert.equal(name, "FB Prospect (#998877)");
  });
});

test("4. Dynamic Field Extractor - Property Configuration", async (t) => {
  await t.test("Extracts configuration for exact question 'WHICH CONFIGURATION ARE YOU LOOKING FOR?'", () => {
    const fields = [{ name: "WHICH CONFIGURATION ARE YOU LOOKING FOR?", value: "3 BHK" }];
    const config = extractConfiguration(fields);
    assert.equal(config, "3 BHK");
  });

  await t.test("Extracts JODI OPTION correctly", () => {
    const fields = [{ name: "WHICH CONFIGURATION ARE YOU LOOKING FOR?", value: "JODI OPTION" }];
    const config = extractConfiguration(fields);
    assert.equal(config, "JODI OPTION");
  });
});

test("5. WhatsApp Branded Message Formatter for Silver Saphire & Navkarmik", async (t) => {
  await t.test("Formats Silver Saphire WhatsApp alert", () => {
    const campaignInfo = {
      campaignName: "Silver Saphire",
      formId: "1044971085049692",
      tableName: "Silver Saphire"
    };

    const leadData = {
      fullName: "Rajesh Sharma",
      phoneNumber: "919892749953",
      propertyType: "3 BHK"
    };

    const formatted = formatWhatsAppAlert(campaignInfo, leadData);

    const expected = `🚨 *NEW LEAD RECEIVED* 🚨

📋 *Campaign Name:* Silver Saphire
📌 *Meta Form ID:* 1044971085049692

👤 *Customer Name:* Rajesh Sharma
📱 *Phone Number:* +919892749953
🏢 *Configuration:* 3 BHK
📁 *Saved To Table:* Silver Saphire`;

    assert.equal(formatted.trim(), expected.trim());
  });

  await t.test("Formats Navkarmik WhatsApp alert", () => {
    const campaignInfo = {
      campaignName: "Navkarmik",
      formId: "900221056143338",
      tableName: "Navkarmik"
    };

    const leadData = {
      fullName: "Amit Verma",
      phoneNumber: "9197738382905",
      propertyType: "JODI OPTION"
    };

    const formatted = formatWhatsAppAlert(campaignInfo, leadData);

    const expected = `🚨 *NEW LEAD RECEIVED* 🚨

📋 *Campaign Name:* Navkarmik
📌 *Meta Form ID:* 900221056143338

👤 *Customer Name:* Amit Verma
📱 *Phone Number:* +9197738382905
🏢 *Configuration:* JODI OPTION
📁 *Saved To Table:* Navkarmik`;

    assert.equal(formatted.trim(), expected.trim());
  });
});
