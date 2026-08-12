"use strict";

require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { sequelize, Floor, Office } = require("../models");
const REAL_OFFICES = require("../seeders/office_directory_bilingual.json");

const FLOOR_MAP = {
  ground_floor: { floor_number: 0, name: "Ground Floor", name_am: "የመሬት ወለል" },
  first_floor: { floor_number: 1, name: "1st Floor", name_am: "1ኛ ፎቅ" },
  second_floor: { floor_number: 2, name: "2nd Floor", name_am: "2ኛ ፎቅ" },
  third_floor: { floor_number: 3, name: "3rd Floor", name_am: "3ኛ ፎቅ" },
  fourth_floor: { floor_number: 4, name: "4th Floor", name_am: "4ኛ ፎቅ" },
  fifth_floor: { floor_number: 5, name: "5th Floor", name_am: "5ኛ ፎቅ" },
};

async function seed() {
  const t = await sequelize.transaction();
  try {
    console.log("Starting office seed...");

    // Wipe existing offices + floors. Use raw queries to avoid constraint issues if any.
    await sequelize.query("DELETE FROM offices", { transaction: t });
    await sequelize.query("DELETE FROM floors", { transaction: t });

    // Insert all configured floors.
    const now = new Date();
    const floorIdByToken = new Map();
    const allTokens = Object.keys(FLOOR_MAP).sort(
      (a, b) => FLOOR_MAP[a].floor_number - FLOOR_MAP[b].floor_number
    );

    const floorRows = allTokens.map((token) => {
      const meta = FLOOR_MAP[token];
      const floorId = uuidv4();
      floorIdByToken.set(token, floorId);
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

    // Deduplicate offices
    const seenRooms = new Set();
    const uniqueOffices = [];

    for (const row of REAL_OFFICES) {
      const key = `${row.floor_token}|${row.room_number}`;
      if (!seenRooms.has(key)) {
        seenRooms.add(key);
        uniqueOffices.push(row);
      } else {
        console.warn(`Skipping duplicate room: ${key}`);
      }
    }

    // Insert offices from the JSON file.
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
    console.log(`Office seed complete: ${allTokens.length} floors + ${REAL_OFFICES.length} offices.`);
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error("Failed to seed offices:", err.name, err.message);
    if (err.errors) {
      console.error(err.errors);
    } else if (err.original) {
      console.error(err.original.message);
    }
    process.exit(1);
  }
}

seed();
