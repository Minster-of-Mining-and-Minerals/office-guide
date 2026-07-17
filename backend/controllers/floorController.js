const { Op } = require("sequelize");
const { Floor, Office } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const { emitSignageUpdate } = require("../utils/signageEvents");

const ALLOWED_SORT = new Set(["floor_number", "name", "created_at", "updated_at"]);

const buildSort = (sort_by, sort_order) => {
  const col = ALLOWED_SORT.has(sort_by) ? sort_by : "floor_number";
  const dir = String(sort_order).toUpperCase() === "DESC" ? "DESC" : "ASC";
  return [[col, dir]];
};

const listFloors = async (req, res) => {
  try {
    const {
      search,
      is_active,
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
      ];
    }
    if (is_active !== undefined) {
      where.is_active = is_active === "true" || is_active === true;
    }

    if (all === "true") {
      const rows = await Floor.findAll({
        where,
        order: buildSort(sort_by, sort_order),
      });
      return res.status(200).json({
        success: true,
        message: "Floors fetched successfully.",
        data: rows,
      });
    }

    const pagination = getPagination(page, limit);
    const data = await Floor.findAndCountAll({
      where,
      order: buildSort(sort_by, sort_order),
      ...pagination,
    });
    return res.status(200).json({
      success: true,
      message: "Floors fetched successfully.",
      data: getPagingData(data, page, limit),
    });
  } catch (error) {
    console.error("listFloors error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const floor = await Floor.findByPk(id);
    if (!floor)
      return res.status(404).json({ success: false, message: "Floor not found." });
    return res.status(200).json({ success: true, data: floor });
  } catch (error) {
    console.error("getFloor error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createFloor = async (req, res) => {
  try {
    const floor = await Floor.create(req.body);
    emitSignageUpdate(req, { entity: "floor", action: "create", id: floor.floor_id });
    return res.status(201).json({
      success: true,
      message: "Floor created successfully.",
      data: floor,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "A floor with this number already exists.",
      });
    }
    console.error("createFloor error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const floor = await Floor.findByPk(id);
    if (!floor)
      return res.status(404).json({ success: false, message: "Floor not found." });

    await floor.update({ ...req.body, updated_at: new Date() });
    emitSignageUpdate(req, { entity: "floor", action: "update", id: floor.floor_id });
    return res.status(200).json({
      success: true,
      message: "Floor updated successfully.",
      data: floor,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "A floor with this number already exists.",
      });
    }
    console.error("updateFloor error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const floor = await Floor.findByPk(id);
    if (!floor)
      return res.status(404).json({ success: false, message: "Floor not found." });

    const officeCount = await Office.count({ where: { floor_id: id } });

    if (officeCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete floor: ${officeCount} office(s) still reference it.`,
      });
    }

    await floor.destroy();
    emitSignageUpdate(req, { entity: "floor", action: "delete", id });
    return res.status(200).json({
      success: true,
      message: "Floor deleted successfully.",
    });
  } catch (error) {
    console.error("deleteFloor error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
};
