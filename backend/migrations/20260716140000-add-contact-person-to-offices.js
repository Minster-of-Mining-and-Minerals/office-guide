"use strict";

/**
 * Adds an optional `contact_person` column to `offices` — the name of the
 * officer/receptionist visitors should ask for when they arrive at a room.
 * Nullable because not every office wants a public contact listed.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("offices", "contact_person", {
      type: Sequelize.STRING(150),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("offices", "contact_person");
  },
};
