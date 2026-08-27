/**
 * Campaign Registry REST API Router
 * 
 * Provides CRUD endpoints for managing form mappings dynamically.
 */

const express = require("express");
const router = express.Router();

const {
  getAllMappings,
  registerFormMapping,
  deleteFormMapping,
  resetRegistry,
  resolveCampaign
} = require("../config/registry");

/**
 * GET /api/campaigns - List all form to campaign mappings
 */
router.get("/api/campaigns", (req, res) => {
  res.status(200).json({
    success: true,
    mappings: getAllMappings()
  });
});

/**
 * GET /api/campaigns/:formId - Resolve specific form mapping
 */
router.get("/api/campaigns/:formId", (req, res) => {
  const formId = req.params.formId;
  const resolved = resolveCampaign(formId);
  res.status(200).json({
    success: true,
    resolved
  });
});

/**
 * POST /api/campaigns - Register or update a form mapping
 */
router.post("/api/campaigns", (req, res) => {
  try {
    const { formId, campaignName, tableName } = req.body;
    if (!formId || !campaignName || !tableName) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: formId, campaignName, tableName"
      });
    }

    const updated = registerFormMapping(formId, campaignName, tableName);
    res.status(200).json({
      success: true,
      message: `Form ID ${formId} mapped to Campaign '${campaignName}' and Table '${tableName}'`,
      mapping: updated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/campaigns/:formId - Delete a form mapping
 */
router.delete("/api/campaigns/:formId", (req, res) => {
  const formId = req.params.formId;
  const deleted = deleteFormMapping(formId);
  if (deleted) {
    res.status(200).json({
      success: true,
      message: `Form ID ${formId} deleted from registry`
    });
  } else {
    res.status(404).json({
      success: false,
      message: `Form ID ${formId} not found in active registry`
    });
  }
});

/**
 * POST /api/campaigns/reset - Reset registry to default values
 */
router.post("/api/campaigns/reset", (req, res) => {
  const mappings = resetRegistry();
  res.status(200).json({
    success: true,
    message: "Campaign registry reset to default specifications",
    mappings
  });
});

module.exports = router;
