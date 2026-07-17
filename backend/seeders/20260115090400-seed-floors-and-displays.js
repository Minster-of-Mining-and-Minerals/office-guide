"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const floorRows = [
      { floor_number: 0, name: "Ground Floor" },
      { floor_number: 1, name: "Floor 1" },
      { floor_number: 2, name: "Floor 2" },
      { floor_number: 3, name: "Floor 3" },
      { floor_number: 4, name: "Floor 4" },
      { floor_number: 5, name: "Floor 5" },
    ].map((f) => ({
      floor_id: uuidv4(),
      floor_number: f.floor_number,
      name: f.name,
      map_image_url: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert("floors", floorRows);

    const displayRows = floorRows.map((floor, idx) => ({
      display_id: uuidv4(),
      display_number: idx + 1, // 1..6
      name: `${floor.name} Display`,
      floor_id: floor.floor_id,
      rotation_seconds: 20,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert("displays", displayRows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("displays", null, {});
    await queryInterface.bulkDelete("floors", null, {});
  },
};
