"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("announcements", "floor_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "floors",
        key: "floor_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("announcements", "floor_id");
  },
};
