const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const {
  Announcement,
  AnnouncementFloor,
  Floor,
  sequelize,
} = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const { emitSignageUpdate } = require("../utils/signageEvents");

// ─── Derived columns (SQL) ─────────────────────────────────────────────
// Status as the kiosk sees it right now. Kept in SQL so the list can
// filter, count and sort by it without loading every row.
const STATUS_SQL = `CASE
  WHEN "Announcement"."is_visible" = false THEN 'hidden'
  WHEN "Announcement"."start_date" > NOW() THEN 'scheduled'
  WHEN "Announcement"."end_date" < NOW() THEN 'ended'
  ELSE 'live' END`;
const STATUS_RANK_SQL = `CASE
  WHEN "Announcement"."is_visible" = false THEN 3
  WHEN "Announcement"."start_date" > NOW() THEN 1
  WHEN "Announcement"."end_date" < NOW() THEN 2
  ELSE 0 END`;
// Lowest floor number an announcement plays on; "all floors" sorts first.
const FLOOR_RANK_SQL = `CASE WHEN "Announcement"."all_floors" THEN -1 ELSE COALESCE((
  SELECT MIN(f.floor_number) FROM announcement_floors af
  JOIN floors f ON f.floor_id = af.floor_id
  WHERE af.announcement_id = "Announcement"."announcement_id"), 9999) END`;
const STATUSES = ["live", "scheduled", "ended", "hidden"];

const buildSort = (sort_by, sort_order) => {
  const dir = String(sort_order).toUpperCase() === "DESC" ? "DESC" : "ASC";
  let primary;
  switch (sort_by) {
    case "title":
    case "created_at":
    case "updated_at":
    case "display_order":
      primary = [sort_by, dir];
      break;
    case "end_date":
      // "No end date" means it never ends, so it goes last when ascending.
      primary = [
        sequelize.literal(
          `"Announcement"."end_date" ${dir} NULLS ${dir === "ASC" ? "LAST" : "FIRST"}`
        ),
      ];
      break;
    case "status":
      primary = [sequelize.literal(`${STATUS_RANK_SQL} ${dir}`)];
      break;
    case "floor":
      primary = [sequelize.literal(`${FLOOR_RANK_SQL} ${dir}`)];
      break;
    default:
      primary = ["display_order", dir];
  }
  // Ties fall back to play order so the list is stable across page loads.
  return [primary, ["display_order", "ASC"], ["created_at", "DESC"]];
};

/** `WHERE` fragment: announcements that play on the given floor. */
const playsOnFloor = (floorId) =>
  sequelize.literal(
    `("Announcement"."all_floors" = true OR EXISTS (
       SELECT 1 FROM announcement_floors af
       WHERE af.announcement_id = "Announcement"."announcement_id"
         AND af.floor_id = ${sequelize.escape(floorId)}))`
  );

/**
 * Reads the floor choice from a create/update body.
 * Accepts `all_floors` ("true"/"false") + `floor_ids` (JSON array string,
 * array, or comma list). Also accepts the legacy single `floor_id`.
 * Returns null when the body does not mention floors at all.
 */
const parseFloorInput = (body) => {
  const hasNew = body.all_floors !== undefined || body.floor_ids !== undefined;
  if (!hasNew && body.floor_id === undefined) return null;

  if (!hasNew) {
    const id = body.floor_id;
    return id && id !== "null" && id !== "global"
      ? { all_floors: false, floor_ids: [String(id)] }
      : { all_floors: true, floor_ids: [] };
  }

  const all = body.all_floors === true || body.all_floors === "true";
  let ids = body.floor_ids ?? [];
  if (typeof ids === "string") {
    try {
      ids = ids.trim().startsWith("[") ? JSON.parse(ids) : ids.split(",");
    } catch {
      ids = [];
    }
  }
  ids = [
    ...new Set(
      (Array.isArray(ids) ? ids : [])
        .map((x) => String(x).trim())
        .filter(Boolean)
    ),
  ];
  return { all_floors: all, floor_ids: all ? [] : ids };
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns an error message, or null when the floor choice is valid. */
const validateFloorInput = async (input) => {
  if (input.all_floors) return null;
  if (input.floor_ids.length === 0) {
    return "Choose at least one floor, or select All floors.";
  }
  if (!input.floor_ids.every((id) => UUID_RE.test(id))) {
    return "Invalid floor selection.";
  }
  const found = await Floor.count({ where: { floor_id: input.floor_ids } });
  if (found !== input.floor_ids.length) {
    return "One or more selected floors no longer exist. Refresh and try again.";
  }
  return null;
};

const saveFloors = async (announcementId, input, transaction) => {
  await AnnouncementFloor.destroy({
    where: { announcement_id: announcementId },
    transaction,
  });
  if (!input.all_floors && input.floor_ids.length) {
    await AnnouncementFloor.bulkCreate(
      input.floor_ids.map((floor_id) => ({
        announcement_id: announcementId,
        floor_id,
        created_at: new Date(),
      })),
      { transaction }
    );
  }
};

/**
 * Adds `floors: [{ floor_id, floor_number, name, name_am }]` (sorted by
 * floor number) and the derived `status` to each announcement.
 */
const withFloors = async (rows) => {
  const list = rows.map((r) => (r.toJSON ? r.toJSON() : r));
  const ids = list.map((r) => r.announcement_id);
  const links = ids.length
    ? await AnnouncementFloor.findAll({
        where: { announcement_id: ids },
        raw: true,
      })
    : [];
  const floorIds = [...new Set(links.map((l) => l.floor_id))];
  const floors = floorIds.length
    ? await Floor.findAll({
        where: { floor_id: floorIds },
        attributes: ["floor_id", "floor_number", "name", "name_am"],
        raw: true,
      })
    : [];
  const byId = new Map(floors.map((f) => [f.floor_id, f]));
  const now = new Date();
  return list.map((r) => ({
    ...r,
    floors: links
      .filter((l) => l.announcement_id === r.announcement_id)
      .map((l) => byId.get(l.floor_id))
      .filter(Boolean)
      .sort((a, b) => a.floor_number - b.floor_number),
    status: !r.is_visible
      ? "hidden"
      : r.start_date && new Date(r.start_date) > now
      ? "scheduled"
      : r.end_date && new Date(r.end_date) < now
      ? "ended"
      : "live",
  }));
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
 * Admin list — paginated, supports search, status, floor and visibility
 * filters, and returns per-status counts for the status tabs.
 * GET /api/announcements
 *
 * Query:
 *   status    live | scheduled | ended | hidden
 *   floor_id  <uuid> = plays on that floor (incl. all-floor ones);
 *             "all"  = only announcements set to all floors
 *   sort_by   display_order | title | created_at | end_date | status | floor
 */
const listAnnouncements = async (req, res) => {
  try {
    const {
      search,
      is_visible,
      floor_id,
      status,
      page = 1,
      limit = 10,
      sort_by,
      sort_order,
      all,
    } = req.query;

    const and = [];
    if (search) {
      and.push({
        [Op.or]: [
          { title: { [Op.iLike]: `%${search}%` } },
          { message: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }
    if (is_visible !== undefined) {
      and.push({ is_visible: is_visible === "true" || is_visible === true });
    }
    if (floor_id === "all") {
      and.push({ all_floors: true });
    } else if (floor_id) {
      if (!UUID_RE.test(String(floor_id))) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid floor_id." });
      }
      and.push(playsOnFloor(String(floor_id)));
    }

    // Counts per status for the tabs: every filter except status itself.
    const countRows = await Announcement.findAll({
      attributes: [
        [sequelize.literal(STATUS_SQL), "status"],
        [sequelize.fn("COUNT", sequelize.literal("*")), "n"],
      ],
      where: { [Op.and]: [...and] },
      group: [sequelize.literal(STATUS_SQL)],
      raw: true,
    });
    const counts = { all: 0, live: 0, scheduled: 0, ended: 0, hidden: 0 };
    for (const r of countRows) {
      counts[r.status] = Number(r.n);
      counts.all += Number(r.n);
    }

    if (STATUSES.includes(status)) {
      and.push(sequelize.where(sequelize.literal(STATUS_SQL), status));
    }
    const where = { [Op.and]: and };

    if (all === "true") {
      const rows = await Announcement.findAll({
        where,
        order: buildSort(sort_by, sort_order),
      });
      return res.status(200).json({
        success: true,
        message: "Announcements fetched successfully.",
        data: await withFloors(rows),
      });
    }

    const pagination = getPagination(page, limit);
    const data = await Announcement.findAndCountAll({
      where,
      order: buildSort(sort_by, sort_order),
      ...pagination,
    });
    data.rows = await withFloors(data.rows);
    return res.status(200).json({
      success: true,
      message: "Announcements fetched successfully.",
      data: { ...getPagingData(data, page, limit), counts },
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
    const [data] = await withFloors([row]);
    return res.status(200).json({ success: true, data });
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

    // No floor choice sent = all floors (matches the old "Global" default).
    const floorInput = parseFloorInput(body) || { all_floors: true, floor_ids: [] };
    const floorError = await validateFloorInput(floorInput);
    if (floorError) {
      safeUnlink(`/uploads/announcements/${req.file.filename}`);
      return res.status(400).json({ success: false, message: floorError });
    }

    // Default display_order to the end of the list — makes the freshest
    // upload the last one on rotation unless the admin reorders.
    const maxOrder = await Announcement.max("display_order");
    const displayOrder = (Number.isFinite(maxOrder) ? maxOrder : -1) + 1;

    const t = await sequelize.transaction();
    let row;
    try {
      row = await Announcement.create({
        title,
        all_floors: floorInput.all_floors,
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
      }, { transaction: t });
      await saveFloors(row.announcement_id, floorInput, t);
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    emitSignageUpdate(req, {
      scope: "announcements",
      action: "create",
      id: row.announcement_id,
    });

    const [data] = await withFloors([row]);
    return res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      data,
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

    const floorInput = parseFloorInput(body);
    if (floorInput) {
      const floorError = await validateFloorInput(floorInput);
      if (floorError) {
        if (req.file) safeUnlink(`/uploads/announcements/${req.file.filename}`);
        return res.status(400).json({ success: false, message: floorError });
      }
      row.all_floors = floorInput.all_floors;
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
    const t = await sequelize.transaction();
    try {
      await row.save({ transaction: t });
      if (floorInput) await saveFloors(row.announcement_id, floorInput, t);
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

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

    const [data] = await withFloors([row]);
    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully.",
      data,
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
    if (floor_id && !UUID_RE.test(String(floor_id))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid floor_id." });
    }
    const now = new Date();
    const rows = await Announcement.findAll({
      where: {
        is_visible: true,
        media_url: { [Op.ne]: null },
        [Op.and]: [
          // Kiosk for a floor: all-floor announcements + ones for that floor.
          ...(floor_id ? [playsOnFloor(String(floor_id))] : []),
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
