"use strict";

/**
 * Product change: a display can now show the whole building instead of a
 * single floor. `displays.floor_id` becomes nullable — NULL means
 * "whole building / all floors" on this screen.
 *
 * We use raw SQL because Sequelize v6's `changeColumn` on Postgres does not
 * always drop NOT NULL and often creates a duplicate FK. This migration also
 * cleans up any duplicate FK left behind by earlier runs.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE displays ALTER COLUMN floor_id DROP NOT NULL"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE displays DROP CONSTRAINT IF EXISTS displays_floor_id_fkey1"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE displays ALTER COLUMN floor_id SET NOT NULL"
    );
  },
};
