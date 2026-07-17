const express = require("express");
const router = express.Router();
const {
  listFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
} = require("../controllers/floorController");
const {
  validateFloorCreate,
  validateFloorUpdate,
} = require("../validators/floorValidator");

/**
 * @swagger
 * tags:
 *   name: Floors
 *   description: Building floors
 */

/**
 * @swagger
 * /floors:
 *   get:
 *     summary: List floors
 *     tags: [Floors]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
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
 *       200: { description: Paginated list of floors }
 */
router.get("/", listFloors);

/**
 * @swagger
 * /floors/{id}:
 *   get:
 *     summary: Get a floor by id
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Floor }
 *       404: { description: Not found }
 */
router.get("/:id", getFloor);

/**
 * @swagger
 * /floors:
 *   post:
 *     summary: Create a floor
 *     tags: [Floors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [floor_number, name]
 *             properties:
 *               floor_number: { type: integer }
 *               name: { type: string }
 *               map_image_url: { type: string, nullable: true }
 *               is_active: { type: boolean }
 *     responses:
 *       201: { description: Floor created }
 *       409: { description: Duplicate floor number }
 */
router.post("/", validateFloorCreate, createFloor);

/**
 * @swagger
 * /floors/{id}:
 *   patch:
 *     summary: Update a floor
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               floor_number: { type: integer }
 *               name: { type: string }
 *               map_image_url: { type: string, nullable: true }
 *               is_active: { type: boolean }
 *     responses:
 *       200: { description: Floor updated }
 */
router.patch("/:id", validateFloorUpdate, updateFloor);
router.put("/:id", validateFloorUpdate, updateFloor);

/**
 * @swagger
 * /floors/{id}:
 *   delete:
 *     summary: Delete a floor (fails if offices or displays still reference it)
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Floor deleted }
 *       409: { description: In use by offices or displays }
 */
router.delete("/:id", deleteFloor);

module.exports = router;
