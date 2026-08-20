const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { Announcement, sequelize } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const { emitSignageUpdate } = require("../utils/signageEvents");

const ALLOWED_SORT = new Set([
  "display_order",
  "title",
  "created_at",
  "updated_at",
]);

const buildSort = (sort_by, sort_order) => {
  const col = ALLOWED_SORT.has(sort_by) ? sort_by : "display_order";
  const dir = String(sort_order).toUpperCase() === "DESC" ? "DESC" : "ASC";
  // Secondary sort by created_at so ties are stable across page loads.
  return [
    [col, dir],
    ["created_at", "DESC"],
  ];
};

// Removes an uploaded file from disk. Best-effort — failures are logged but
// never bubble up because they only leak a file, not user data.
const safeUnlink = (mediaUrl) => {
  if (!mediaUrl) return;
  try {
    // `media_url` is stored as `/uploads/announcements/<file>`; resolve it
    // to the disk path under `public/uploads/announcements/<file>`.
    const rel = mediaUrl.replace(/^\/+/, "");
    const abs = path.join(__dirname, "..", "public", rel);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (err) {
    console.error("safeUnlink error:", err.message);
  }
};

const inferMediaType = (mime) => {
  if (typeof mime !== "string") return null;
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return null;
};

/**
 * Admin list — paginated, supports search + visibility filter.
 * GET /api/announcements
 */
const listAnnouncements = async (req, res) => {
  try {
    const {
      search,
      is_visible,
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
        { title: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (is_visible !== undefined) {
      where.is_visible = is_visible === "true" || is_visible === true;
    }
    if (floor_id !== undefined) {
      where.floor_id = floor_id === "null" || floor_id === "" ? null : floor_id;
    }

    if (all === "true") {
      const rows = await Announcement.findAll({
        where,
        order: buildSort(sort_by, sort_order),
      });
      return res.status(200).json({
        success: true,
        message: "Announcements fetched successfully.",
        data: rows,
      });
    }

    const pagination = getPagination(page, limit);
    const data = await Announcement.findAndCountAll({
      where,
      order: buildSort(sort_by, sort_order),
      ...pagination,
    });
    return res.status(200).json({
      success: true,
      message: "Announcements fetched successfully.",
      data: getPagingData(data, page, limit),
    });
  } catch (error) {
    console.error("listAnnouncements error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Admin get one — used to hydrate the edit dialog.
 * GET /api/announcements/:id
 */
const getAnnouncement = async (req, res) => {
  try {
    const row = await Announcement.findByPk(req.params.id);
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }
    return res.status(200).json({ success: true, data: row });
  } catch (error) {
    console.error("getAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Create — multipart/form-data because the media file rides along with the
 * metadata. Multer places the parsed file at `req.file` and text fields
 * at `req.body`.
 *
 * POST /api/announcements
 */
const createAnnouncement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A media file (image or video) is required.",
      });
    }
    const mediaType = inferMediaType(req.file.mimetype);
    if (!mediaType) {
      safeUnlink(`/uploads/announcements/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: "Only images and videos are supported.",
      });
    }

    const body = req.body || {};
    const title = (body.title || "").trim();
    if (!title) {
      safeUnlink(`/uploads/announcements/${req.file.filename}`);
      return res
        .status(400)
        .json({ success: false, message: "Title is required." });
    }

    // Default display_order to the end of the list — makes the freshest
    // upload the last one on rotation unless the admin reorders.
    const maxOrder = await Announcement.max("display_order");
    const displayOrder = (Number.isFinite(maxOrder) ? maxOrder : -1) + 1;

    const row = await Announcement.create({
      title,
      floor_id: body.floor_id && body.floor_id !== "null" && body.floor_id !== "" ? body.floor_id : null,
      message: body.message ? String(body.message).trim() || null : null,
      media_type: mediaType,
      media_url: `/uploads/announcements/${req.file.filename}`,
      duration_seconds:
        Number.parseInt(body.duration_seconds, 10) > 0
          ? Number.parseInt(body.duration_seconds, 10)
          : 10,
      display_order: displayOrder,
      audio_enabled: body.audio_enabled === "true" || body.audio_enabled === true,
      is_visible:
        body.is_visible === undefined
          ? true
          : body.is_visible === "true" || body.is_visible === true,
      start_date: body.start_date ? new Date(body.start_date) : null,
      end_date: body.end_date ? new Date(body.end_date) : null,
    });

    emitSignageUpdate(req, {
      scope: "announcements",
      action: "create",
      id: row.announcement_id,
    });

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      data: row,
    });
  } catch (error) {
    if (req.file) safeUnlink(`/uploads/announcements/${req.file.filename}`);
    console.error("createAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Update — the media file is optional; when a new one is supplied the old
 * disk file is deleted after the DB row swap succeeds.
 *
 * PATCH /api/announcements/:id
 */
const updateAnnouncement = async (req, res) => {
  try {
    const row = await Announcement.findByPk(req.params.id);
    if (!row) {
      if (req.file) safeUnlink(`/uploads/announcements/${req.file.filename}`);
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }

    const body = req.body || {};
    const previousUrl = row.media_url;

    if (body.floor_id !== undefined) {
      row.floor_id = body.floor_id && body.floor_id !== "null" && body.floor_id !== "" ? body.floor_id : null;
    }

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        if (req.file) safeUnlink(`/uploads/announcements/${req.file.filename}`);
        return res
          .status(400)
          .json({ success: false, message: "Title is required." });
      }
      row.title = title;
    }
    if (body.message !== undefined) {
      const msg = body.message === null ? null : String(body.message).trim();
      row.message = msg && msg.length ? msg : null;
    }
    if (body.duration_seconds !== undefined) {
      const n = Number.parseInt(body.duration_seconds, 10);
      if (Number.isFinite(n) && n > 0) row.duration_seconds = n;
    }
    if (body.display_order !== undefined) {
      const n = Number.parseInt(body.display_order, 10);
      if (Number.isFinite(n) && n >= 0) row.display_order = n;
    }
    if (body.audio_enabled !== undefined) {
      row.audio_enabled =
        body.audio_enabled === "true" || body.audio_enabled === true;
    }
    if (body.is_visible !== undefined) {
      row.is_visible =
        body.is_visible === "true" || body.is_visible === true;
    }
    if (body.start_date !== undefined) {
      row.start_date =
        body.start_date && body.start_date !== "null"
          ? new Date(body.start_date)
          : null;
    }
    if (body.end_date !== undefined) {
      row.end_date =
        body.end_date && body.end_date !== "null"
          ? new Date(body.end_date)
          : null;
    }

    if (req.file) {
      const mediaType = inferMediaType(req.file.mimetype);
      if (!mediaType) {
        safeUnlink(`/uploads/announcements/${req.file.filename}`);
        return res.status(400).json({
          success: false,
          message: "Only images and videos are supported.",
        });
      }
      row.media_type = mediaType;
      row.media_url = `/uploads/announcements/${req.file.filename}`;
    }

    row.updated_at = new Date();
    await row.save();

    // Only delete the old file if a new one has actually replaced it and
    // the DB save above committed cleanly.
    if (req.file && previousUrl && previousUrl !== row.media_url) {
      safeUnlink(previousUrl);
    }

    emitSignageUpdate(req, {
      scope: "announcements",
      action: "update",
      id: row.announcement_id,
    });

    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully.",
      data: row,
    });
  } catch (error) {
    if (req.file) safeUnlink(`/uploads/announcements/${req.file.filename}`);
    console.error("updateAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Reorder — accepts an array of `announcement_id`s in the desired order.
 * Writes `display_order` transactionally.
 *
 * PATCH /api/announcements/reorder
 */
const reorderAnnouncements = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { ordered_ids } = req.body || {};
    if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "ordered_ids must be a non-empty array.",
      });
    }

    const existing = await Announcement.findAll({
      attributes: ["announcement_id"],
      transaction: t,
    });
    const known = new Set(existing.map((a) => a.announcement_id));
    for (const id of ordered_ids) {
      if (!known.has(id)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Announcement ${id} does not exist.`,
        });
      }
    }

    await Promise.all(
      ordered_ids.map((id, idx) =>
        Announcement.update(
          { display_order: idx, updated_at: new Date() },
          { where: { announcement_id: id }, transaction: t }
        )
      )
    );

    await t.commit();
    emitSignageUpdate(req, {
      scope: "announcements",
      action: "reorder",
    });
    return res.status(200).json({
      success: true,
      message: "Announcements reordered successfully.",
    });
  } catch (error) {
    await t.rollback();
    console.error("reorderAnnouncements error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Bulk update `is_visible` on many announcements in one call. Used by the
 * admin table's checkbox multi-select ("Show on display" / "Hide from
 * display" bulk actions). One socket broadcast for the whole batch keeps
 * kiosks from thrashing when a large selection is toggled.
 *
 * PATCH /api/announcements/bulk-visibility
 * body: { ids: string[], is_visible: boolean }
 */
const bulkSetVisibility = async (req, res) => {
  try {
    const { ids, is_visible } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ids must be a non-empty array.",
      });
    }
    if (typeof is_visible !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "is_visible must be a boolean.",
      });
    }

    const [affected] = await Announcement.update(
      { is_visible, updated_at: new Date() },
      { where: { announcement_id: ids } }
    );

    emitSignageUpdate(req, {
      scope: "announcements",
      action: "bulk_visibility",
      count: affected,
    });

    return res.status(200).json({
      success: true,
      message: `Updated ${affected} announcement${affected === 1 ? "" : "s"}.`,
      data: { affected },
    });
  } catch (error) {
    console.error("bulkSetVisibility error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Delete — also removes the file on disk.
 * DELETE /api/announcements/:id
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const row = await Announcement.findByPk(req.params.id);
    if (!row) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }

    const url = row.media_url;
    await row.destroy();
    safeUnlink(url);

    emitSignageUpdate(req, {
      scope: "announcements",
      action: "delete",
      id: req.params.id,
    });

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error("deleteAnnouncement error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Public — active announcements suitable for playback on the kiosk. Filters
 * out invisible entries and anything outside its scheduling window.
 *
 * GET /api/public/announcements
 */
const getPublicAnnouncements = async (_req, res) => {
  try {
    const { floor_id } = _req.query;
    const now = new Date();
    const rows = await Announcement.findAll({
      where: {
        is_visible: true,
        media_url: { [Op.ne]: null },
        ...(floor_id && {
          [Op.or]: [{ floor_id }, { floor_id: null }],
        }),
        [Op.and]: [
          {
            [Op.or]: [
              { start_date: null },
              { start_date: { [Op.lte]: now } },
            ],
          },
          {
            [Op.or]: [
              { end_date: null },
              { end_date: { [Op.gte]: now } },
            ],
          },
        ],
      },
      order: [
        ["display_order", "ASC"],
        ["created_at", "ASC"],
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Public announcements fetched successfully.",
      data: {
        server_time: now.toISOString(),
        announcements: rows,
      },
    });
  } catch (error) {
    console.error("getPublicAnnouncements error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

module.exports = {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  reorderAnnouncements,
  bulkSetVisibility,
  deleteAnnouncement,
  getPublicAnnouncements,
};
