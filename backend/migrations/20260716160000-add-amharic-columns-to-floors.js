"use strict";

/**
 * Adds the Amharic sibling for `floors.name`. English column stays required;
 * Amharic is added nullable so this migration is safe on live data. The
 * `NOT NULL` constraint is added at the application layer via the validator
 * once we've backfilled AM values.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("floors", "name_am", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("floors", "name_am");
  },
};
