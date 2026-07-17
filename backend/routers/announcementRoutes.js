const express = require("express");
const router = express.Router();

const upload = require("../middlewares/announcementUpload");
const {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  reorderAnnouncements,
  bulkSetVisibility,
  deleteAnnouncement,
  getPublicAnnouncements,
} = require("../controllers/announcementController");

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Full-screen media (image/video) shown on kiosk displays
 */

/**
 * @swagger
 * /public/announcements:
 *   get:
 *     summary: (Public) Active announcement carousel payload
 *     tags: [Announcements]
 *     responses:
 *       200: { description: Announcements currently scheduled to play }
 */
router.get("/public/announcements", getPublicAnnouncements);

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: List announcements (admin)
 *     tags: [Announcements]
 *   post:
 *     summary: Create an announcement (multipart/form-data)
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, media]
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               media: { type: string, format: binary }
 *               duration_seconds: { type: integer, default: 10 }
 *               audio_enabled: { type: boolean, default: false }
 *               is_visible: { type: boolean, default: true }
 *               start_date: { type: string, format: date-time }
 *               end_date: { type: string, format: date-time }
 *     responses:
 *       201: { description: Announcement created }
 */
router.get("/announcements", listAnnouncements);
router.post("/announcements", upload.single("media"), createAnnouncement);

/**
 * @swagger
 * /announcements/reorder:
 *   patch:
 *     summary: Reorder announcements
 *     tags: [Announcements]
 */
router.patch("/announcements/reorder", reorderAnnouncements);

/**
 * @swagger
 * /announcements/bulk-visibility:
 *   patch:
 *     summary: Toggle "on display" for many announcements at once
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, is_visible]
 *             properties:
 *               ids: { type: array, items: { type: string } }
 *               is_visible: { type: boolean }
 */
router.patch("/announcements/bulk-visibility", bulkSetVisibility);

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get an announcement by id
 *     tags: [Announcements]
 *   patch:
 *     summary: Update an announcement (multipart/form-data, media optional)
 *     tags: [Announcements]
 *   delete:
 *     summary: Delete an announcement (also removes the media file)
 *     tags: [Announcements]
 */
router.get("/announcements/:id", getAnnouncement);
router.patch(
  "/announcements/:id",
  upload.single("media"),
  updateAnnouncement
);
router.delete("/announcements/:id", deleteAnnouncement);

module.exports = router;
