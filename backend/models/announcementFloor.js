"use strict";
const { Model } = require("sequelize");

/** Join row: an announcement that plays on a specific floor. */
module.exports = (sequelize, DataTypes) => {
  class AnnouncementFloor extends Model {}

  AnnouncementFloor.init(
    {
      announcement_id: { type: DataTypes.UUID, primaryKey: true },
      floor_id: { type: DataTypes.UUID, primaryKey: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: "AnnouncementFloor",
      tableName: "announcement_floors",
      timestamps: false,
      underscored: true,
    }
  );

  return AnnouncementFloor;
};
