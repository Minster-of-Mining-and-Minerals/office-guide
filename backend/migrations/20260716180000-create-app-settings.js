"use strict";

/**
 * Simple key/value store for global runtime configuration — theme colors,
 * kiosk feature flags, etc. Values are JSONB so we can store arbitrary
 * shapes without ever needing another migration.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("app_settings", {
      key: {
        type: Sequelize.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("app_settings");
  },
};
