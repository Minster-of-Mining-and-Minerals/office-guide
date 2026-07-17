"use strict";

/**
 * Adds a `services` column to `offices` — a native Postgres text[] so we can
 * store per-office service tags like ["Passport renewal", "License inquiry"]
 * without a separate table.
 *
 * We default to an empty array on insert (server-side) so existing rows stay
 * consistent. Sequelize v6 handles reads/writes to text[] natively via
 * DataTypes.ARRAY(DataTypes.STRING).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("offices", "services", {
      type: Sequelize.ARRAY(Sequelize.STRING(150)),
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("offices", "services");
  },
};
