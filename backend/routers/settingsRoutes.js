const express = require("express");
const router = express.Router();

const {
  getPublicTheme,
  updateTheme,
  resetTheme,
  getPublicDisplayMode,
  updateDisplayMode,
  resetDisplayMode,
} = require("../controllers/settingsController");
const {
  validateThemeUpdate,
  validateDisplayModeUpdate,
} = require("../validators/settingsValidator");

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Global runtime configuration (theme, feature flags)
 */

/**
 * @swagger
 * /public/theme:
 *   get:
 *     summary: Get the current public theme (no auth)
 *     tags: [Settings]
 *     responses:
 *       200: { description: Theme colors used by /office-guide and kiosks }
 */
router.get("/public/theme", getPublicTheme);

/**
 * @swagger
 * /settings/theme:
 *   patch:
 *     summary: Update the public theme
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page_bg:      { type: string, example: "#14100a" }
 *               card_bg:      { type: string, example: "#ffffff" }
 *               card_text:    { type: string, example: "#7a5a1c" }
 *               accent:       { type: string, example: "#F5C518" }
 *               accent_dark:  { type: string, example: "#7a5a1c" }
 *     responses:
 *       200: { description: Updated theme }
 *   delete:
 *     summary: Reset theme to defaults
 *     tags: [Settings]
 *     responses:
 *       200: { description: Theme reset }
 */
router.patch("/settings/theme", validateThemeUpdate, updateTheme);
router.delete("/settings/theme", resetTheme);

/**
 * @swagger
 * /public/display-mode:
 *   get:
 *     summary: Get the current display mode (no auth)
 *     tags: [Settings]
 *     responses:
 *       200: { description: Display mode config used by /office-guide kiosks }
 */
router.get("/public/display-mode", getPublicDisplayMode);

/**
 * @swagger
 * /settings/display-mode:
 *   patch:
 *     summary: Update the public display mode
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [guide_only, announcements_only, both]
 *               rotation_seconds:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 3600
 *     responses:
 *       200: { description: Updated display mode }
 *   delete:
 *     summary: Reset display mode to defaults
 *     tags: [Settings]
 */
router.patch(
  "/settings/display-mode",
  validateDisplayModeUpdate,
  updateDisplayMode
);
router.delete("/settings/display-mode", resetDisplayMode);

module.exports = router;
