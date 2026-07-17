"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("displays", {
      display_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      display_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      floor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "floors",
          key: "floor_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      rotation_seconds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
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

    await queryInterface.addIndex("displays", ["display_number"], {
      name: "displays_number_idx",
    });
    await queryInterface.addIndex("displays", ["floor_id"], {
      name: "displays_floor_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("displays");
  },
};
