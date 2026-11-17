"use strict";

const { v4: uuidv4 } = require("uuid");
const { Floor, Office } = require("../models");
const REAL_OFFICES = require("./office_directory_bilingual.json");

const FLOOR_MAP = {
  ground_floor: { floor_number: 0, name: "Ground Floor", name_am: "የመሬት ወለል" },
  first_floor: { floor_number: 1, name: "1st Floor", name_am: "1ኛ ፎቅ" },
  "1st_floor": { floor_number: 1, name: "1st Floor", name_am: "1ኛ ፎቅ" },
  second_floor: { floor_number: 2, name: "2nd Floor", name_am: "2ኛ ፎቅ" },
  "2nd_floor": { floor_number: 2, name: "2nd Floor", name_am: "2ኛ ፎቅ" },
  third_floor: { floor_number: 3, name: "3rd Floor", name_am: "3ኛ ፎቅ" },
  "3rd_floor": { floor_number: 3, name: "3rd Floor", name_am: "3ኛ ፎቅ" },
  fourth_floor: { floor_number: 4, name: "4th Floor", name_am: "4ኛ ፎቅ" },
  "4th_floor": { floor_number: 4, name: "4th Floor", name_am: "4ኛ ፎቅ" },
  "5th_floor": { floor_number: 5, name: "5th Floor", name_am: "5ኛ ፎቅ" },
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // NON-DESTRUCTIVE: this seeder runs on every container start. Only
      // populate floors/offices on a fresh database — if any floor already
      // exists, the admin owns the data and we must not touch it.
      const [[{ n: existingFloors }]] = await queryInterface.sequelize.query(
        "SELECT COUNT(*)::int AS n FROM floors",
        { transaction: t }
      );
      if (existingFloors > 0) {
        await t.commit();
        console.log("Office seed skipped: floors already exist.");
        return;
      }

      // 3. Insert all configured floors.
      const now = new Date();
      const floorIdByToken = new Map();
      
      const floorsToInsert = [];
      const seenFloorNumbers = new Set();
      
      const uniqueFloorMeta = [];
      for (const token of Object.keys(FLOOR_MAP)) {
        const meta = FLOOR_MAP[token];
        if (!seenFloorNumbers.has(meta.floor_number)) {
          seenFloorNumbers.add(meta.floor_number);
          uniqueFloorMeta.push({ token, meta });
        }
      }
      
      uniqueFloorMeta.sort((a, b) => a.meta.floor_number - b.meta.floor_number);

      const floorRows = uniqueFloorMeta.map(({ token, meta }) => {
        const floorId = uuidv4();
        for (const tkn of Object.keys(FLOOR_MAP)) {
           if (FLOOR_MAP[tkn].floor_number === meta.floor_number) {
               floorIdByToken.set(tkn, floorId);
           }
        }
        
        return {
          floor_id: floorId,
          floor_number: meta.floor_number,
          name: meta.name,
          name_am: meta.name_am,
          is_active: true,
          map_image_url: null,
          created_at: now,
          updated_at: now,
        };
      });

      await Floor.bulkCreate(floorRows, { transaction: t });

      // 4. Deduplicate offices
      const seenRooms = new Set();
      const uniqueOffices = [];

      for (const row of REAL_OFFICES) {
        const key = `${row.floor_token}|${row.room_number}`;
        if (!seenRooms.has(key)) {
          seenRooms.add(key);
          uniqueOffices.push(row);
        }
      }

      // 5. Insert offices from the JSON file.
      const officeRows = uniqueOffices.map((row) => {
        return {
          office_id: uuidv4(),
          floor_id: floorIdByToken.get(row.floor_token),
          room_number: row.room_number,
          display_order: row.display_order,
          name: row.name,
          name_am: row.name_am,
          department: row.department,
          department_am: row.department_am,
          contact_person: row.contact_person || null,
          contact_person_am: row.contact_person_am || null,
          description: row.description || null,
          description_am: row.description_am || null,
          services: row.services || [],
          services_am: row.services_am || [],
          created_at: now,
          updated_at: now,
        };
      });

      await Office.bulkCreate(officeRows, { transaction: t });

      await t.commit();
      console.log(`Office seed complete: ${floorRows.length} floors + ${uniqueOffices.length} offices.`);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    // Best-effort cleanup so seed can be re-run.
    await queryInterface.sequelize.query("DELETE FROM offices");
    await queryInterface.sequelize.query("DELETE FROM floors");
  },
};
