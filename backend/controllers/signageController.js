const { Floor, Office } = require("../models");

// Shared attribute list for the public office payload. Keeping this in one
// place prevents drift when we add or remove office fields. Both English and
// Amharic variants are returned; the frontend picks based on the active
// locale (falls back to English when the AM value is null/empty).
const PUBLIC_OFFICE_ATTRS = [
  "office_id",
  "name",
  "name_am",
  "department",
  "department_am",
  "room_number",
  "description",
  "description_am",
  "display_order",
  "services",
  "services_am",
  "contact_person",
  "contact_person_am",
];

const PUBLIC_FLOOR_ATTRS = [
  "floor_id",
  "floor_number",
  "name",
  "name_am",
  "map_image_url",
];

/**
 * Public Office Guide — the whole-building payload used by the scrollable
 * /office-guide page.
 *
 * GET /api/public/office-guide
 */
const getPublicOfficeGuide = async (_req, res) => {
  try {
    const floors = await Floor.findAll({
      where: { is_active: true },
      order: [["floor_number", "ASC"]],
      attributes: PUBLIC_FLOOR_ATTRS,
      include: [
        {
          model: Office,
          as: "offices",
          attributes: PUBLIC_OFFICE_ATTRS,
        },
      ],
    });

    const floorsPayload = floors.map((f) => {
      const plain = f.get({ plain: true });
      plain.offices = (plain.offices || []).sort(
        (a, b) =>
          a.display_order - b.display_order ||
          a.room_number.localeCompare(b.room_number)
      );
      return plain;
    });

    return res.status(200).json({
      success: true,
      message: "Office guide fetched successfully.",
      data: {
        server_time: new Date().toISOString(),
        floors: floorsPayload,
      },
    });
  } catch (error) {
    console.error("getPublicOfficeGuide error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Dashboard summary widget.
 * GET /api/dashboard/signage-summary
 */
const getSignageSummary = async (_req, res) => {
  try {
    const [totalFloors, totalOffices] = await Promise.all([
      Floor.count(),
      Office.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_floors: totalFloors,
        total_offices: totalOffices,
      },
    });
  } catch (error) {
    console.error("getSignageSummary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicOfficeGuide,
  getSignageSummary,
};
