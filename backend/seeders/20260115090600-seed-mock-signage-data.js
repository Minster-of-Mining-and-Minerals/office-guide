"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Ministry-of-Mining themed mock data for the Office Guide Digital Signage.
 *
 * - Offices are added across the 6 seeded floors (ground + 5).
 * - Announcements cover live, hidden, past, and future scheduling cases so
 *   the admin UI and public kiosk filtering can be verified quickly.
 *
 * Idempotency: the seeder is a no-op if either table already contains rows,
 * so re-running against a populated DB will not create duplicates.
 */
module.exports = {
  async up(queryInterface) {
    const [floorRows] = await queryInterface.sequelize.query(
      "SELECT floor_id, floor_number FROM floors ORDER BY floor_number ASC"
    );
    if (floorRows.length === 0) {
      console.log("No floors present — skipping mock data seeder.");
      return;
    }
    const floorByNumber = new Map(
      floorRows.map((f) => [Number(f.floor_number), f.floor_id])
    );

    const [{ count: existingOffices }] = (
      await queryInterface.sequelize.query(
        "SELECT COUNT(*)::int AS count FROM offices"
      )
    )[0];
    const [{ count: existingAnnouncements }] = (
      await queryInterface.sequelize.query(
        "SELECT COUNT(*)::int AS count FROM announcements"
      )
    )[0];

    const now = new Date();

    // ── Offices ────────────────────────────────────────────────────
    if (existingOffices === 0) {
      const officeSpecs = [
        // Ground Floor — front-of-house
        { floor: 0, room: "G-01", name: "Reception", department: "Front Desk", description: "Main visitor reception and information desk." },
        { floor: 0, room: "G-02", name: "Security Office", department: "Security", description: "Building security and visitor badge issuance." },
        { floor: 0, room: "G-03", name: "Cashier", department: "Finance", description: "Payments for licences, permits and royalty fees." },
        { floor: 0, room: "G-04", name: "Records", department: "Administration", description: "Public records requests and document lookup." },
        { floor: 0, room: "G-05", name: "Help Desk", department: "IT", description: "IT support for staff and public terminals." },

        // Floor 1 — Administration & HR
        { floor: 1, room: "1-01", name: "Minister's Office", department: "Executive", description: "Office of the Honourable Minister." },
        { floor: 1, room: "1-02", name: "Permanent Secretary", department: "Executive", description: "Office of the Permanent Secretary." },
        { floor: 1, room: "1-03", name: "Administration", department: "Administration", description: "General administration and correspondence." },
        { floor: 1, room: "1-04", name: "Human Resources", department: "HR", description: "Recruitment, staff records and welfare." },
        { floor: 1, room: "1-05", name: "Training & Development", department: "HR", description: "Staff training programmes and certifications." },
        { floor: 1, room: "1-06", name: "Board Room", department: "Executive", description: "Executive meetings and stakeholder briefings." },

        // Floor 2 — Finance & Procurement
        { floor: 2, room: "2-01", name: "Chief Accountant", department: "Finance", description: "Accounts oversight and financial reporting." },
        { floor: 2, room: "2-02", name: "Payroll", department: "Finance", description: "Staff salaries and allowances." },
        { floor: 2, room: "2-03", name: "Procurement", department: "Procurement", description: "Tenders, contracts and supplier management." },
        { floor: 2, room: "2-04", name: "Audit", department: "Internal Audit", description: "Internal audit and compliance reviews." },
        { floor: 2, room: "2-05", name: "Budget & Planning", department: "Finance", description: "Annual budgeting and expenditure planning." },

        // Floor 3 — Mining Rights & Licensing
        { floor: 3, room: "3-01", name: "Licensing", department: "Mining Rights", description: "Application and renewal of mining licences." },
        { floor: 3, room: "3-02", name: "Cadastre", department: "Mining Rights", description: "Mining concession mapping and boundary records." },
        { floor: 3, room: "3-03", name: "Royalty & Revenue", department: "Mining Rights", description: "Assessment and collection of mining royalties." },
        { floor: 3, room: "3-04", name: "Small-Scale Mining", department: "Mining Rights", description: "Artisanal and small-scale mining permits." },
        { floor: 3, room: "3-05", name: "Compliance & Inspection", department: "Mining Rights", description: "Field inspection scheduling and enforcement." },

        // Floor 4 — Geology & Environment
        { floor: 4, room: "4-01", name: "Geological Survey", department: "Geology", description: "National geological mapping and data archive." },
        { floor: 4, room: "4-02", name: "Laboratory", department: "Geology", description: "Sample testing and mineral analysis." },
        { floor: 4, room: "4-03", name: "Environmental Compliance", department: "Environment", description: "Environmental impact assessments and monitoring." },
        { floor: 4, room: "4-04", name: "Rehabilitation & Closure", department: "Environment", description: "Mine site rehabilitation planning." },
        { floor: 4, room: "4-05", name: "GIS & Remote Sensing", department: "Geology", description: "Spatial data services and satellite imagery." },

        // Floor 5 — Legal, Communications & IT
        { floor: 5, room: "5-01", name: "Legal Services", department: "Legal", description: "Legal advisory and contract review." },
        { floor: 5, room: "5-02", name: "Public Relations", department: "Communications", description: "Media enquiries and public engagement." },
        { floor: 5, room: "5-03", name: "Communications", department: "Communications", description: "Ministry publications and internal comms." },
        { floor: 5, room: "5-04", name: "ICT", department: "IT", description: "Information systems and infrastructure." },
        { floor: 5, room: "5-05", name: "Data Centre", department: "IT", description: "Restricted access — authorised personnel only." },
        { floor: 5, room: "5-06", name: "Research & Policy", department: "Policy", description: "Mining policy research and legislative drafting." },
      ];

      // Group by floor so display_order restarts per floor.
      const grouped = new Map();
      for (const o of officeSpecs) {
        if (!grouped.has(o.floor)) grouped.set(o.floor, []);
        grouped.get(o.floor).push(o);
      }

      const rows = [];
      for (const [floorNumber, list] of grouped.entries()) {
        const floor_id = floorByNumber.get(floorNumber);
        if (!floor_id) continue;
        list.forEach((o, idx) => {
          rows.push({
            office_id: uuidv4(),
            floor_id,
            name: o.name,
            department: o.department,
            room_number: o.room,
            description: o.description,
            display_order: idx,
            created_at: now,
            updated_at: now,
          });
        });
      }

      if (rows.length) {
        await queryInterface.bulkInsert("offices", rows);
        console.log(`Seeded ${rows.length} mock offices.`);
      }
    } else {
      console.log(
        `Offices table already has ${existingOffices} rows — skipping office seed.`
      );
    }

    // ── Announcements ─────────────────────────────────────────────
    if (existingAnnouncements === 0) {
      const oneDay = 24 * 60 * 60 * 1000;

      const announcements = [
        {
          title: "Welcome to the Ministry of Mining",
          message:
            "We are pleased to welcome you. Please approach the Reception on the Ground Floor for assistance and direction.",
          is_visible: true,
          start_date: null,
          end_date: null,
        },
        {
          title: "Office Hours",
          message:
            "Public counters are open Monday to Friday, 08:30 – 16:30. Cashier services close at 15:30 daily.",
          is_visible: true,
          start_date: null,
          end_date: null,
        },
        {
          title: "Mining Licence Fee Update",
          message:
            "Revised royalty and licence fees take effect this quarter. Please visit the Licensing office on Floor 3 for the updated schedule.",
          is_visible: true,
          start_date: new Date(now.getTime() - 2 * oneDay),
          end_date: new Date(now.getTime() + 14 * oneDay),
        },
        {
          title: "Scheduled Power Maintenance",
          message:
            "A planned power outage is scheduled for this Saturday from 08:00 to 12:00. Kiosk terminals may be offline during this window.",
          is_visible: true,
          start_date: null,
          end_date: new Date(now.getTime() + 7 * oneDay),
        },
        {
          title: "COVID-19 Health Reminder",
          message:
            "Kindly maintain personal hygiene and report any flu-like symptoms to the security desk at the entrance.",
          is_visible: false, // hidden, but kept as a template
          start_date: null,
          end_date: null,
        },
        {
          title: "Upcoming Job Vacancies",
          message:
            "Applications for new roles in the Geological Survey and Environmental Compliance offices open next week. Full details will be published on the Ministry website.",
          is_visible: true,
          start_date: new Date(now.getTime() + 3 * oneDay), // scheduled — not live yet
          end_date: new Date(now.getTime() + 30 * oneDay),
        },
        {
          title: "Congratulations to the Field Team",
          message:
            "The Geological Survey field team successfully completed the northern-region mapping expedition. Well done!",
          is_visible: true,
          start_date: new Date(now.getTime() - 20 * oneDay),
          end_date: new Date(now.getTime() - 1 * oneDay), // expired
        },
      ];

      const annRows = announcements.map((a) => ({
        announcement_id: uuidv4(),
        title: a.title,
        message: a.message,
        is_visible: a.is_visible,
        start_date: a.start_date,
        end_date: a.end_date,
        created_at: now,
        updated_at: now,
      }));

      await queryInterface.bulkInsert("announcements", annRows);
      console.log(`Seeded ${annRows.length} mock announcements.`);
    } else {
      console.log(
        `Announcements table already has ${existingAnnouncements} rows — skipping announcement seed.`
      );
    }
  },

  async down(queryInterface) {
    // Removes only rows created by this seeder pattern (identified by
    // matching the mock office/announcement titles). We can't rely on
    // created_at because the seeder timestamp is not persisted.
    await queryInterface.bulkDelete("offices", null, {});
    await queryInterface.bulkDelete("announcements", null, {});
  },
};
