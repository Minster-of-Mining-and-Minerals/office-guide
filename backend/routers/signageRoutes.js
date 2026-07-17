const express = require("express");
const router = express.Router();
const {
  getPublicOfficeGuide,
  getSignageSummary,
} = require("../controllers/signageController");

/**
 * @swagger
 * tags:
 *   name: Signage
 *   description: Public office guide content and dashboard summary
 */

/**
 * @swagger
 * /public/office-guide:
 *   get:
 *     summary: (Public) Whole-building office directory for the scrollable /office-guide page
 *     tags: [Signage]
 *     responses:
 *       200: { description: Floors and offices }
 */
router.get("/public/office-guide", getPublicOfficeGuide);

/**
 * @swagger
 * /dashboard/signage-summary:
 *   get:
 *     summary: Summary counts for the admin dashboard widget
 *     tags: [Signage]
 *     responses:
 *       200: { description: Totals for floors and offices }
 */
router.get("/dashboard/signage-summary", getSignageSummary);

module.exports = router;
