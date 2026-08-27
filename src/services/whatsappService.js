/**
 * Campaign-Branded WhatsApp Alert Dispatcher
 * 
 * Formats and dispatches instant WhatsApp alerts to admin numbers.
 */

const axios = require("axios");

// Notification dispatch log for dashboard inspection
const alertLogs = [];

/**
 * Formats the WhatsApp notification message according to exact specifications
 * 
 * @param {Object} campaignInfo - Resolved campaign details ({ campaignName, formId, tableName })
 * @param {Object} leadData - Extracted lead details ({ fullName, phoneNumber, propertyType })
 * @returns {string} Formatted WhatsApp message
 */
function formatWhatsAppAlert(campaignInfo, leadData) {
  const phoneFormatted = leadData.phoneNumber.startsWith("+")
    ? leadData.phoneNumber
    : `+${leadData.phoneNumber}`;

  return `🚨 *NEW LEAD RECEIVED* 🚨

📋 *Campaign Name:* ${campaignInfo.campaignName}
📌 *Meta Form ID:* ${campaignInfo.formId}

👤 *Customer Name:* ${leadData.fullName}
📱 *Phone Number:* ${phoneFormatted}
🏢 *Configuration:* ${leadData.propertyType}
📁 *Saved To Table:* ${campaignInfo.tableName}`;
}

/**
 * Gets target admin phone numbers list
 * @returns {string[]} Array of phone numbers
 */
function getAdminNumbers() {
  const envNumbers = process.env.WHATSAPP_ADMIN_NUMBERS;
  if (envNumbers) {
    return envNumbers.split(",").map(num => num.trim()).filter(Boolean);
  }
  return ["+919892749953", "+917738382905"];
}

/**
 * Sends WhatsApp notification to configured admin numbers
 * 
 * @param {Object} campaignInfo 
 * @param {Object} leadData 
 * @returns {Promise<Object>} Dispatch result status
 */
async function sendWhatsAppAlert(campaignInfo, leadData) {
  const message = formatWhatsAppAlert(campaignInfo, leadData);
  const adminNumbers = getAdminNumbers();
  const provider = (process.env.WHATSAPP_PROVIDER || "console").toLowerCase();

  const dispatchRecord = {
    id: `alert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    adminNumbers,
    message,
    provider,
    status: "SENT"
  };

  console.log(`\n------------------ WHATSAPP ADMIN ALERT ------------------`);
  console.log(message);
  console.log(`Target Numbers: ${adminNumbers.join(", ")}`);
  console.log(`---------------------------------------------------------\n`);

  // Provider implementations
  try {
    if (provider === "meta_cloud") {
      const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;

      if (phoneNumberId && accessToken) {
        for (const recipient of adminNumbers) {
          const cleanTo = recipient.replace(/\+/g, "");
          await axios.post(
            `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to: cleanTo,
              type: "text",
              text: { body: message }
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }
      }
    } else if (provider === "twilio") {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "+14155238886";

      if (accountSid && authToken) {
        for (const recipient of adminNumbers) {
          const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          const params = new URLSearchParams();
          params.append("From", fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`);
          params.append("To", recipient.startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`);
          params.append("Body", message);

          await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            params.toString(),
            {
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
              }
            }
          );
        }
      }
    } else if (provider === "ultramsg") {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
      const token = process.env.ULTRAMSG_TOKEN;

      if (instanceId && token) {
        for (const recipient of adminNumbers) {
          const cleanTo = recipient.replace(/\+/g, "");
          await axios.post(
            `https://api.ultramsg.com/${instanceId}/messages/chat`,
            { token, to: cleanTo, body: message }
          );
        }
      }
    }

    alertLogs.unshift(dispatchRecord);

    return {
      success: true,
      provider,
      recipients: adminNumbers,
      message,
      dispatchRecord
    };
  } catch (error) {
    const errMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error("[WhatsApp Service] Alert API Dispatch Error:", errMessage);
    dispatchRecord.status = "FAILED";
    dispatchRecord.error = errMessage;
    alertLogs.unshift(dispatchRecord);

    return {
      success: false,
      provider,
      error: errMessage,
      recipients: adminNumbers,
      message,
      dispatchRecord
    };
  }
}

/**
 * Returns recent alert logs
 */
function getRecentAlertLogs(limit = 50) {
  return alertLogs.slice(0, limit);
}

module.exports = {
  formatWhatsAppAlert,
  sendWhatsAppAlert,
  getAdminNumbers,
  getRecentAlertLogs
};
