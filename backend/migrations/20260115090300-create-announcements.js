"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("announcements", {
      announcement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex(
      "announcements",
      ["is_visible", "start_date", "end_date"],
      { name: "announcements_active_idx" }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("announcements");
  },
};
