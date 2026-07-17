"use strict";

/**
 * Backfills a plausible contact person (officer name) on the demo offices,
 * keyed by room_number. Idempotent — running twice keeps the same values.
 * Rooms not in the map are left untouched.
 */

const CONTACT_BY_ROOM = {
  // Ground Floor
  "G-01": "Ms. Selam Bekele",
  "G-02": "Mr. Dawit Assefa",
  "G-03": "Mrs. Hana Girma",
  "G-04": "Mr. Yonas Tesfaye",
  "G-05": "Ms. Lily Mekonnen",

  // Floor 1
  "1-01": "Hon. Minister's Secretariat",
  "1-02": "Mr. Kebede Wolde",
  "1-03": "Ms. Meaza Alemayehu",
  "1-04": "Mr. Bereket Fikadu",
  "1-05": "Ms. Ruth Haile",
  "1-06": "Facilities Desk",

  // Floor 2
  "2-01": "Mr. Solomon Gebre",
  "2-02": "Ms. Betty Kassa",
  "2-03": "Mr. Tewodros Abera",
  "2-04": "Mrs. Aster Nigatu",
  "2-05": "Mr. Fasil Berhanu",

  // Floor 3
  "3-01": "Mr. Mesfin Tadesse",
  "3-02": "Ms. Sara Wolde",
  "3-03": "Mr. Getachew Mamo",
  "3-04": "Ms. Rahel Desta",
  "3-05": "Mr. Abel Feleke",

  // Floor 4
  "4-01": "Dr. Alemu Tefera",
  "4-02": "Ms. Genet Belachew",
  "4-03": "Mr. Henok Bekele",
  "4-04": "Mrs. Tigist Gizaw",
  "4-05": "Mr. Nathan Yohannes",

  // Floor 5
  "5-01": "Ms. Eden Zerihun",
  "5-02": "Mr. Samuel Woldu",
  "5-03": "Ms. Bethlehem Alemu",
  "5-04": "Mr. Robel Haile",
  // 5-05 (Data Centre): intentionally left blank — restricted room.
  "5-06": "Dr. Selamawit Girma",
};

module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT office_id, room_number FROM offices"
    );

    let updated = 0;
    for (const row of existing) {
      const person = CONTACT_BY_ROOM[row.room_number];
      if (!person) continue;
      await queryInterface.sequelize.query(
        "UPDATE offices SET contact_person = $1, updated_at = NOW() WHERE office_id = $2",
        { bind: [person, row.office_id] }
      );
      updated += 1;
    }
    console.log(`Backfilled contact_person on ${updated} offices.`);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE offices SET contact_person = NULL"
    );
  },
};
