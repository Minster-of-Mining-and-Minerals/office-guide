"use strict";

const { v4: uuidv4 } = require("uuid");
const ALL_FLOOR_OFFICES = require("./all-floor-offices.json");

/**
 * Wipe-and-replace seeder for the complete Ministry office directory.
 *
 * All six floors and their offices are stored in the single bundled
 * all-floor-offices.json dataset.
 */

const FLOOR_MAP = {
  ground_floor: {
    floor_number: 0,
    name: "Ground Floor",
    name_am: "የመሬት ወለል",
  },
  "1st_floor": { floor_number: 1, name: "1st Floor", name_am: "1ኛ ፎቅ" },
  "2nd_floor": { floor_number: 2, name: "2nd Floor", name_am: "2ኛ ፎቅ" },
  "3rd_floor": { floor_number: 3, name: "3rd Floor", name_am: "3ኛ ፎቅ" },
  "4th_floor": { floor_number: 4, name: "4th Floor", name_am: "4ኛ ፎቅ" },
  "5th_floor": { floor_number: 5, name: "5th Floor", name_am: "5ኛ ፎቅ" },
};

function validateOfficeData(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("all-floor-offices.json must contain at least one office");
  }

  for (const [index, row] of rows.entries()) {
    if (!FLOOR_MAP[row.floor_token]) {
      throw new Error(`Unknown floor_token at office row ${index + 1}`);
    }
    if (!row.room_number || !row.name || !row.name_am) {
      throw new Error(`Missing required office data at row ${index + 1}`);
    }
    if (!Number.isInteger(row.display_order)) {
      throw new Error(`Invalid display_order at office row ${index + 1}`);
    }
    if (!Array.isArray(row.services) || !Array.isArray(row.services_am)) {
      throw new Error(`Services must be arrays at office row ${index + 1}`);
    }
    if (row.services.length !== row.services_am.length) {
      throw new Error(`Bilingual service count mismatch at office row ${index + 1}`);
    }
  }
}

module.exports = {
  async up(queryInterface) {
    validateOfficeData(ALL_FLOOR_OFFICES);

    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        "UPDATE displays SET floor_id = NULL, updated_at = NOW()",
        { transaction }
      );
      await queryInterface.sequelize.query("DELETE FROM offices", { transaction });
      await queryInterface.sequelize.query("DELETE FROM floors", { transaction });

      const floorIdByToken = new Map();
      const floorTokens = Object.keys(FLOOR_MAP).sort(
        (a, b) => FLOOR_MAP[a].floor_number - FLOOR_MAP[b].floor_number
      );

      for (const token of floorTokens) {
        const floor = FLOOR_MAP[token];
        const floorId = uuidv4();
        floorIdByToken.set(token, floorId);
        await queryInterface.sequelize.query(
          `INSERT INTO floors
             (floor_id, floor_number, name, name_am, is_active, map_image_url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, TRUE, NULL, NOW(), NOW())`,
          {
            bind: [floorId, floor.floor_number, floor.name, floor.name_am],
            transaction,
          }
        );
      }

      for (const office of ALL_FLOOR_OFFICES) {
        await queryInterface.sequelize.query(
          `INSERT INTO offices (
             office_id, floor_id, room_number, display_order,
             name, name_am, department, department_am,
             contact_person, contact_person_am, description, description_am,
             services, services_am, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8,
             $9, $10, $11, $12, $13, $14, NOW(), NOW()
           )`,
          {
            bind: [
              uuidv4(),
              floorIdByToken.get(office.floor_token),
              office.room_number,
              office.display_order,
              office.name,
              office.name_am,
              office.department,
              office.department_am,
              office.contact_person,
              office.contact_person_am,
              office.description,
              office.description_am,
              office.services,
              office.services_am,
            ],
            transaction,
          }
        );
      }

      await transaction.commit();
      console.log(
        `Office seed complete: ${floorTokens.length} floors and ${ALL_FLOOR_OFFICES.length} offices.`
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DELETE FROM offices");
    await queryInterface.sequelize.query("DELETE FROM floors");
  },
};
