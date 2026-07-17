"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("offices", {
      office_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
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
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      room_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addConstraint("offices", {
      fields: ["floor_id", "room_number"],
      type: "unique",
      name: "offices_floor_room_unique",
    });

    await queryInterface.addIndex("offices", ["floor_id", "display_order"], {
      name: "offices_floor_order_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("offices");
  },
};
