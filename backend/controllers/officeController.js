const { Op } = require("sequelize");
const { Office, Floor, sequelize } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const { emitSignageUpdate } = require("../utils/signageEvents");

const ALLOWED_SORT = new Set([
  "name",
  "room_number",
  "department",
  "display_order",
  "created_at",
  "updated_at",
]);

const buildSort = (sort_by, sort_order) => {
  const col = ALLOWED_SORT.has(sort_by) ? sort_by : "display_order";
  const dir = String(sort_order).toUpperCase() === "DESC" ? "DESC" : "ASC";
  return [[col, dir]];
};

const listOffices = async (req, res) => {
  try {
    const {
      search,
      floor_id,
      page = 1,
      limit = 10,
      sort_by,
      sort_order,
      all,
    } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
        { room_number: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (floor_id) where.floor_id = floor_id;

    const include = [
      { model: Floor, as: "floor", attributes: ["floor_id", "floor_number", "name"] },
    ];

    if (all === "true") {
      const rows = await Office.findAll({
        where,
        include,
        order: buildSort(sort_by, sort_order),
      });
      return res.status(200).json({
        success: true,
        message: "Offices fetched successfully.",
        data: rows,
      });
    }

    const pagination = getPagination(page, limit);
    const data = await Office.findAndCountAll({
      where,
      include,
      order: buildSort(sort_by, sort_order),
      ...pagination,
      distinct: true,
    });
    return res.status(200).json({
      success: true,
      message: "Offices fetched successfully.",
      data: getPagingData(data, page, limit),
    });
  } catch (error) {
    console.error("listOffices error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id, {
      include: [
        {
          model: Floor,
          as: "floor",
          attributes: ["floor_id", "floor_number", "name"],
        },
      ],
    });
    if (!office)
      return res.status(404).json({ success: false, message: "Office not found." });
    return res.status(200).json({ success: true, data: office });
  } catch (error) {
    console.error("getOffice error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOffice = async (req, res) => {
  try {
    const floor = await Floor.findByPk(req.body.floor_id);
    if (!floor)
      return res
        .status(400)
        .json({ success: false, message: "Selected floor does not exist." });

    const existingOffice = await Office.findOne({
      where: {
        floor_id: req.body.floor_id,
        room_number: req.body.room_number,
        name: req.body.name,
      },
    });
    if (existingOffice) {
      return res.status(409).json({
        success: false,
        message: "This office already exists in the selected room.",
      });
    }

    // Default display_order to end of floor if not provided.
    if (req.body.display_order === undefined) {
      const maxOrder = await Office.max("display_order", {
        where: { floor_id: req.body.floor_id },
      });
      req.body.display_order = (Number.isFinite(maxOrder) ? maxOrder : -1) + 1;
    }

    const office = await Office.create(req.body);
    emitSignageUpdate(req, {
      entity: "office",
      action: "create",
      id: office.office_id,
      floor_id: office.floor_id,
    });
    return res.status(201).json({
      success: true,
      message: "Office created successfully.",
      data: office,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "An office with this room number already exists on this floor.",
      });
    }
    console.error("createOffice error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);
    if (!office)
      return res.status(404).json({ success: false, message: "Office not found." });

    if (req.body.floor_id && req.body.floor_id !== office.floor_id) {
      const floor = await Floor.findByPk(req.body.floor_id);
      if (!floor)
        return res.status(400).json({
          success: false,
          message: "Selected floor does not exist.",
        });
    }

    if (req.body.room_number || req.body.floor_id || req.body.name) {
      const existingOffice = await Office.findOne({
        where: {
          office_id: { [Op.ne]: id },
          floor_id: req.body.floor_id || office.floor_id,
          room_number: req.body.room_number || office.room_number,
          name: req.body.name || office.name,
        },
      });
      if (existingOffice) {
        return res.status(409).json({
          success: false,
          message: "This office already exists in the selected room.",
        });
      }
    }

    await office.update({ ...req.body, updated_at: new Date() });
    emitSignageUpdate(req, {
      entity: "office",
      action: "update",
      id: office.office_id,
      floor_id: office.floor_id,
    });
    return res.status(200).json({
      success: true,
      message: "Office updated successfully.",
      data: office,
    });
  } catch (error) {
    console.error("updateOffice error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);
    if (!office)
      return res.status(404).json({ success: false, message: "Office not found." });

    const floor_id = office.floor_id;
    await office.destroy();
    emitSignageUpdate(req, {
      entity: "office",
      action: "delete",
      id,
      floor_id,
    });
    return res
      .status(200)
      .json({ success: true, message: "Office deleted successfully." });
  } catch (error) {
    console.error("deleteOffice error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const reorderOffices = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { floor_id, ordered_ids } = req.body;

    const officesOnFloor = await Office.findAll({
      where: { floor_id },
      attributes: ["office_id"],
      transaction: t,
    });
    const knownIds = new Set(officesOnFloor.map((o) => o.office_id));

    for (const id of ordered_ids) {
      if (!knownIds.has(id)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Office ${id} does not belong to floor ${floor_id}.`,
        });
      }
    }

    await Promise.all(
      ordered_ids.map((id, idx) =>
        Office.update(
          { display_order: idx, updated_at: new Date() },
          { where: { office_id: id }, transaction: t }
        )
      )
    );

    await t.commit();
    emitSignageUpdate(req, { entity: "office", action: "reorder", floor_id });
    return res.status(200).json({
      success: true,
      message: "Offices reordered successfully.",
    });
  } catch (error) {
    await t.rollback();
    console.error("reorderOffices error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listOffices,
  getOffice,
  createOffice,
  updateOffice,
  deleteOffice,
  reorderOffices,
};
