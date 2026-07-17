const { AppSetting } = require("../models");
const { emitSignageUpdate } = require("../utils/signageEvents");

// Single canonical settings key for the public-facing theme.
const THEME_KEY = "public_theme";
const DISPLAY_MODE_KEY = "display_mode";

/**
 * Defaults used when the DB row is missing OR when a client-supplied theme
 * is only partially specified. Keep this as the single source of truth for
 * what a valid theme looks like.
 */
// Dark slate palette used on a fresh install.
//   - `page_bg`   = slate-900. The bottom-to-black overlay in
//                   office-guide/page.tsx darkens toward the bottom.
//   - `card_bg`   = slate-800 — solid dark surface for each office card.
//   - `accent`    = exact hex for `--golden-classic` (hsl(45 100% 50%)).
//   - `accent_dark` = warm dark brown for text sitting on top of the
//                   accent-gradient room-number tile.
const DEFAULT_THEME = Object.freeze({
  page_bg: "#0F172A",
  card_bg: "#1E293B",
  card_text: "#F1F5F9",
  accent: "#FFBF00",
  accent_dark: "#7A5A1C",
});

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const isHex = (v) => typeof v === "string" && HEX.test(v.trim());

/**
 * Public read of the current theme. Anyone can call this — the office guide
 * fetches it on page load. Always resolves to a full theme by merging DB
 * values (if any) over `DEFAULT_THEME`.
 *
 * GET /api/public/theme
 */
const getPublicTheme = async (_req, res) => {
  try {
    const row = await AppSetting.findByPk(THEME_KEY);
    const stored = (row && row.value) || {};
    const theme = { ...DEFAULT_THEME, ...stored };
    res.status(200).json({ success: true, data: theme });
  } catch (err) {
    console.error("getPublicTheme error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin update. Accepts a partial payload — only the keys that are present
 * are updated. Anything else falls through to the stored value or the
 * default. Emits a socket event so open guide pages refresh instantly.
 *
 * PATCH /api/settings/theme
 */
const updateTheme = async (req, res) => {
  try {
    const row = await AppSetting.findByPk(THEME_KEY);
    const stored = (row && row.value) || {};

    const incoming = req.body || {};
    // The validator has already accepted these, but re-check here so any bad
    // hex a caller sneaks in doesn't corrupt the DB. Unknown keys are dropped.
    const clean = {};
    for (const key of Object.keys(DEFAULT_THEME)) {
      const val = incoming[key];
      if (val === undefined || val === null || val === "") continue;
      if (!isHex(val)) {
        return res.status(400).json({
          success: false,
          message: `Invalid hex color for "${key}": ${val}`,
        });
      }
      clean[key] = val.trim();
    }

    const merged = { ...DEFAULT_THEME, ...stored, ...clean };

    if (row) {
      row.value = merged;
      await row.save();
    } else {
      await AppSetting.create({ key: THEME_KEY, value: merged });
    }

    emitSignageUpdate(req, { scope: "theme" });

    res.status(200).json({
      success: true,
      message: "Theme updated.",
      data: merged,
    });
  } catch (err) {
    console.error("updateTheme error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Admin: reset to defaults (deletes the row so any future default change
 * flows through automatically).
 *
 * DELETE /api/settings/theme
 */
const resetTheme = async (req, res) => {
  try {
    await AppSetting.destroy({ where: { key: THEME_KEY } });
    emitSignageUpdate(req, { scope: "theme" });
    res
      .status(200)
      .json({ success: true, message: "Theme reset.", data: DEFAULT_THEME });
  } catch (err) {
    console.error("resetTheme error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Display-mode settings for the public /office-guide screen. Drives which
 * content the kiosk shows:
 *   - "guide_only"          — office directory only (default legacy behavior)
 *   - "announcements_only"  — full-screen announcement carousel only
 *   - "both"                — alternates between the guide and the carousel
 *                             on a `rotation_seconds` cadence
 *
 * `rotation_seconds` is only consulted when `mode === "both"`. Clamped to
 * a sensible range in the validator so a `1` doesn't burn CPU on every
 * kiosk.
 */
const DEFAULT_DISPLAY_MODE = Object.freeze({
  mode: "guide_only",
  rotation_seconds: 60,
});

const ALLOWED_MODES = new Set(["guide_only", "announcements_only", "both"]);

/**
 * Public read of the current display mode.
 * GET /api/public/display-mode
 */
const getPublicDisplayMode = async (_req, res) => {
  try {
    const row = await AppSetting.findByPk(DISPLAY_MODE_KEY);
    const stored = (row && row.value) || {};
    const merged = { ...DEFAULT_DISPLAY_MODE, ...stored };
    // Guard against stale/invalid persisted values.
    if (!ALLOWED_MODES.has(merged.mode)) merged.mode = DEFAULT_DISPLAY_MODE.mode;
    if (
      typeof merged.rotation_seconds !== "number" ||
      !Number.isFinite(merged.rotation_seconds) ||
      merged.rotation_seconds < 5
    ) {
      merged.rotation_seconds = DEFAULT_DISPLAY_MODE.rotation_seconds;
    }
    return res.status(200).json({ success: true, data: merged });
  } catch (err) {
    console.error("getPublicDisplayMode error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message });
  }
};

/**
 * Admin partial update. Validator has already checked shape/values.
 * PATCH /api/settings/display-mode
 */
const updateDisplayMode = async (req, res) => {
  try {
    const row = await AppSetting.findByPk(DISPLAY_MODE_KEY);
    const stored = (row && row.value) || {};
    const incoming = req.body || {};

    const merged = { ...DEFAULT_DISPLAY_MODE, ...stored };
    if (incoming.mode !== undefined) merged.mode = incoming.mode;
    if (incoming.rotation_seconds !== undefined) {
      merged.rotation_seconds = incoming.rotation_seconds;
    }

    if (row) {
      row.value = merged;
      await row.save();
    } else {
      await AppSetting.create({ key: DISPLAY_MODE_KEY, value: merged });
    }

    emitSignageUpdate(req, { scope: "display_mode" });

    return res.status(200).json({
      success: true,
      message: "Display mode updated.",
      data: merged,
    });
  } catch (err) {
    console.error("updateDisplayMode error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message });
  }
};

/**
 * Reset display mode to defaults (deletes the row).
 * DELETE /api/settings/display-mode
 */
const resetDisplayMode = async (req, res) => {
  try {
    await AppSetting.destroy({ where: { key: DISPLAY_MODE_KEY } });
    emitSignageUpdate(req, { scope: "display_mode" });
    return res.status(200).json({
      success: true,
      message: "Display mode reset.",
      data: DEFAULT_DISPLAY_MODE,
    });
  } catch (err) {
    console.error("resetDisplayMode error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message });
  }
};

module.exports = {
  getPublicTheme,
  updateTheme,
  resetTheme,
  DEFAULT_THEME,
  THEME_KEY,
  getPublicDisplayMode,
  updateDisplayMode,
  resetDisplayMode,
  DEFAULT_DISPLAY_MODE,
  DISPLAY_MODE_KEY,
};
