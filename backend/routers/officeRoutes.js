const express = require("express");
const router = express.Router();
const {
  listOffices,
  getOffice,
  createOffice,
  updateOffice,
  deleteOffice,
  reorderOffices,
} = require("../controllers/officeController");
const {
  validateOfficeCreate,
  validateOfficeUpdate,
  validateOfficeReorder,
} = require("../validators/officeValidator");

/**
 * @swagger
 * tags:
 *   name: Offices
 *   description: Offices located on floors
 */

/**
 * @swagger
 * /offices:
 *   get:
 *     summary: List offices
 *     tags: [Offices]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: floor_id
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sort_by
 *         schema: { type: string }
 *       - in: query
 *         name: sort_order
 *         schema: { type: string, enum: [ASC, DESC] }
 *       - in: query
 *         name: all
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Paginated list of offices }
 */
router.get("/", listOffices);

/**
 * @swagger
 * /offices/reorder:
 *   patch:
 *     summary: Reorder offices within one floor
 *     tags: [Offices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [floor_id, ordered_ids]
 *             properties:
 *               floor_id: { type: string }
 *               ordered_ids:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200: { description: Reordered }
 */
router.patch("/reorder", validateOfficeReorder, reorderOffices);

/**
 * @swagger
 * /offices/{id}:
 *   get:
 *     summary: Get an office by id
 *     tags: [Offices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Office }
 *       404: { description: Not found }
 */
router.get("/:id", getOffice);

/**
 * @swagger
 * /offices:
 *   post:
 *     summary: Create an office
 *     tags: [Offices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [floor_id, name, room_number]
 *             properties:
 *               floor_id: { type: string }
 *               name: { type: string }
 *               department: { type: string }
 *               room_number: { type: string }
 *               description: { type: string }
 *               display_order: { type: integer }
 *     responses:
 *       201: { description: Office created }
 *       409: { description: Duplicate room number on this floor }
 */
router.post("/", validateOfficeCreate, createOffice);

/**
 * @swagger
 * /offices/{id}:
 *   patch:
 *     summary: Update an office
 *     tags: [Offices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Office updated }
 */
router.patch("/:id", validateOfficeUpdate, updateOffice);
router.put("/:id", validateOfficeUpdate, updateOffice);

/**
 * @swagger
 * /offices/{id}:
 *   delete:
 *     summary: Delete an office
 *     tags: [Offices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Office deleted }
 */
router.delete("/:id", deleteOffice);

module.exports = router;
