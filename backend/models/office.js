"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Office extends Model {
    static associate(models) {
      Office.belongsTo(models.Floor, {
        foreignKey: "floor_id",
        as: "floor",
      });
    }
  }

  Office.init(
    {
      office_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      floor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      name_am: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      department_am: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      contact_person: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      contact_person_am: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      room_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description_am: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      services: {
        type: DataTypes.ARRAY(DataTypes.STRING(150)),
        allowNull: false,
        defaultValue: [],
      },
      services_am: {
        type: DataTypes.ARRAY(DataTypes.STRING(150)),
        allowNull: false,
        defaultValue: [],
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Office",
      tableName: "offices",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["floor_id", "room_number"],
          name: "offices_floor_room_unique",
        },
        {
          fields: ["floor_id", "display_order"],
          name: "offices_floor_order_idx",
        },
      ],
    }
  );

  return Office;
};
