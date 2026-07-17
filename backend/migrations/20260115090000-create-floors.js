"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("floors", {
      floor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      floor_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      map_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("floors", ["floor_number"], {
      name: "floors_floor_number_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("floors");
  },
};
