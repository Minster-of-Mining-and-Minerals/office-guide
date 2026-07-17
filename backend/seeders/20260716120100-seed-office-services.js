"use strict";

/**
 * Backfills a `services` array on the existing seeded offices, keyed by
 * room_number. Idempotent — running twice yields the same result because we
 * just overwrite with UPDATE on the well-known room_number values, and rows
 * whose room_number is not in the map are left alone.
 *
 * Custom rooms added by the admin UI keep whatever services they were saved
 * with; only the demo offices are touched.
 */

const SERVICES_BY_ROOM = {
  // Ground Floor
  "G-01": ["Visitor check-in", "Directions & wayfinding", "Lost & found"],
  "G-02": ["Visitor badges", "Vehicle access passes", "Incident reporting"],
  "G-03": [
    "Licence fee payments",
    "Permit renewal fees",
    "Royalty payments",
    "Receipt reprints",
  ],
  "G-04": [
    "Public records request",
    "Document lookup",
    "Certified copies",
  ],
  "G-05": ["Password reset", "Kiosk terminal support", "Wi-Fi assistance"],

  // Floor 1 — Administration & HR
  "1-01": ["Ministerial appointments"],
  "1-02": ["Executive briefings"],
  "1-03": ["Official correspondence", "Meeting scheduling"],
  "1-04": [
    "Recruitment enquiries",
    "Staff records",
    "Leave applications",
    "Employee welfare",
  ],
  "1-05": [
    "Training programmes",
    "Certification requests",
    "Professional development",
  ],
  "1-06": ["Meeting bookings"],

  // Floor 2 — Finance & Procurement
  "2-01": ["Financial reports", "Accounts oversight"],
  "2-02": ["Payslip queries", "Allowances", "Tax certificates"],
  "2-03": [
    "Tender submissions",
    "Supplier registration",
    "Contract enquiries",
  ],
  "2-04": ["Audit queries", "Compliance advice"],
  "2-05": ["Budget submissions", "Expenditure planning"],

  // Floor 3 — Mining Rights & Licensing
  "3-01": [
    "New licence applications",
    "Licence renewals",
    "Transfer of ownership",
    "Status enquiries",
  ],
  "3-02": [
    "Concession mapping",
    "Boundary verification",
    "Cadastre records",
  ],
  "3-03": [
    "Royalty assessment",
    "Revenue collection",
    "Payment schedules",
  ],
  "3-04": [
    "Small-scale mining permits",
    "Artisanal miner registration",
    "Cooperative support",
  ],
  "3-05": [
    "Inspection scheduling",
    "Enforcement notices",
    "Compliance reporting",
  ],

  // Floor 4 — Geology & Environment
  "4-01": [
    "Geological maps",
    "Data archive access",
    "Field survey requests",
  ],
  "4-02": [
    "Sample submission",
    "Mineral analysis",
    "Assay reports",
  ],
  "4-03": [
    "EIA submission",
    "Environmental monitoring reports",
    "Compliance certificates",
  ],
  "4-04": [
    "Rehabilitation plans",
    "Mine closure applications",
    "Reclamation certificates",
  ],
  "4-05": [
    "GIS data requests",
    "Satellite imagery",
    "Spatial analysis",
  ],

  // Floor 5 — Legal, Communications & IT
  "5-01": ["Legal advisory", "Contract review", "Statutory interpretation"],
  "5-02": ["Media enquiries", "Press releases"],
  "5-03": ["Ministry publications", "Internal communications"],
  "5-04": ["Systems access", "Email accounts", "Network support"],
  "5-05": [], // restricted — no public services
  "5-06": ["Policy briefings", "Research requests", "Legislative drafting"],
};

module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT office_id, room_number FROM offices"
    );

    let updated = 0;
    for (const row of existing) {
      const services = SERVICES_BY_ROOM[row.room_number];
      if (!services) continue;
      // Use `bind` (not `replacements`) so the array is sent as a real
      // parameter — `replacements` inlines JS arrays into SQL and breaks
      // on any string containing quotes/ampersands.
      await queryInterface.sequelize.query(
        "UPDATE offices SET services = $1, updated_at = NOW() WHERE office_id = $2",
        {
          bind: [services, row.office_id],
        }
      );
      updated += 1;
    }
    console.log(`Backfilled services on ${updated} offices.`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE offices SET services = ARRAY[]::varchar[]"
    );
  },
};
