/**
 * CLI Script to test Meta Webhook Execution Pipeline with Sample Payloads
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = require("../server");

async function runWebhookTests() {
  const PORT = process.env.PORT || 3000;
  
  // Start temporary server listener if not running
  const server = app.listen(PORT, async () => {
    console.log(`\n================ ONLINE TEST SUITE RUNNER ================`);
    console.log(`Server listening on http://localhost:${PORT} for payload tests...\n`);

    const sampleFiles = [
      "meta_lead_payload_malad_main.json",
      "meta_lead_payload_malad_2bhk.json",
      "meta_lead_payload_secondary.json",
      "meta_lead_payload_unknown.json"
    ];

    try {
      for (const fileName of sampleFiles) {
        const filePath = path.join(__dirname, "../samples", fileName);
        const payload = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        console.log(`\n>>> Testing Sample Payload: ${fileName}`);
        const response = await axios.post(`http://localhost:${PORT}/webhook`, payload);

        console.log(`Status Code: ${response.status}`);
        console.log(`Execution Response:`, JSON.stringify(response.data, null, 2));
      }
      console.log(`\n================ ALL PAYLOAD TESTS PASSED ================ \n`);
    } catch (err) {
      console.error("Test Execution Error:", err.response ? err.response.data : err.message);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runWebhookTests();
