"use strict";

module.exports = (sequelize, DataTypes) => {
  const AppSetting = sequelize.define(
    "AppSetting",
    {
      key: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      tableName: "app_settings",
      timestamps: true,
      createdAt: false,
      updatedAt: "updated_at",
    }
  );

  return AppSetting;
};
