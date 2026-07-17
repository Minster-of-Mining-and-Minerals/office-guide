const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Storage config for announcement media (images + videos).
 *
 * Files land under `public/uploads/announcements/` so the top-level
 * `/uploads` static handler in app.js serves them out at
 * `/uploads/announcements/<file>` automatically — no extra route
 * needed.
 *
 * No file size limit is enforced here per product requirement — the
 * kiosk assets may be large videos and we control the upload UI.
 */
const uploadDir = path.join(__dirname, "../public/uploads/announcements");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "")
      .slice(0, 60);
    cb(null, `${uniqueSuffix}_${baseName || "media"}${ext}`);
  },
});

// Accept every image/* and video/* mime — nothing else. The
// controller further validates the resolved `media_type`.
const fileFilter = (_req, file, cb) => {
  const mime = file.mimetype || "";
  if (mime.startsWith("image/") || mime.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${mime || file.originalname}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  // Deliberately no `limits.fileSize` — admin uploads only.
});

module.exports = upload;
