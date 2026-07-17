"use strict";

/**
 * Product change: every display now shows the whole building.
 *
 * This seeder clears floor_id for the 6 originally seeded displays and gives
 * them generic names. It only touches displays that still match the original
 * seed name pattern "<Floor Name> Display" so custom user-created displays
 * are left untouched.
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [displays] = await queryInterface.sequelize.query(
      `SELECT display_id, display_number, name
       FROM displays
       WHERE name LIKE '%Display' AND display_number BETWEEN 1 AND 6
       ORDER BY display_number ASC`
    );

    for (const d of displays) {
      const generic = `Signage Screen ${d.display_number}`;
      await queryInterface.sequelize.query(
        `UPDATE displays SET floor_id = NULL, name = :name, updated_at = :now
         WHERE display_id = :id`,
        {
          replacements: { name: generic, now, id: d.display_id },
        }
      );
    }

    console.log(
      `Unpinned ${displays.length} seeded display(s) — they now show the whole building.`
    );
  },

  async down(queryInterface) {
    // Best-effort rollback: reassign each display to the floor whose
    // floor_number matches (display_number - 1) and restore its original name.
    const [floors] = await queryInterface.sequelize.query(
      "SELECT floor_id, floor_number, name FROM floors"
    );
    const floorByNumber = new Map(
      floors.map((f) => [Number(f.floor_number), f])
    );

    const [displays] = await queryInterface.sequelize.query(
      `SELECT display_id, display_number FROM displays
       WHERE name LIKE 'Signage Screen %' AND display_number BETWEEN 1 AND 6`
    );

    const now = new Date();
    for (const d of displays) {
      const floor = floorByNumber.get(d.display_number - 1);
      if (!floor) continue;
      await queryInterface.sequelize.query(
        `UPDATE displays SET floor_id = :fid, name = :name, updated_at = :now
         WHERE display_id = :id`,
        {
          replacements: {
            fid: floor.floor_id,
            name: `${floor.name} Display`,
            now,
            id: d.display_id,
          },
        }
      );
    }
  },
};
