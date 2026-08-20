"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Floor extends Model {
    static associate(models) {
      Floor.hasMany(models.Office, {
        foreignKey: "floor_id",
        as: "offices",
      });
      Floor.hasMany(models.Announcement, {
        foreignKey: "floor_id",
        as: "announcements",
      });
    }
  }

  Floor.init(
    {
      floor_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      floor_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
          name: {
            type: DataTypes.STRING(100),
            allowNull: false,
          },
          name_am: {
            type: DataTypes.STRING(100),
            allowNull: true,
          },
      map_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      modelName: "Floor",
      tableName: "floors",
      timestamps: false,
      underscored: true,
    }
  );

  return Floor;
};
