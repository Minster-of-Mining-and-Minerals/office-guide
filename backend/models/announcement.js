"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Announcement extends Model {
    static associate(models) {
      Announcement.belongsTo(models.Floor, {
        foreignKey: "floor_id",
        as: "floor",
      });
    }
  }

  Announcement.init(
    {
      announcement_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      floor_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // Optional caption / text overlay. The full-screen carousel does not
      // render this today, but it's kept so admins can annotate uploads.
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Nullable at the DB level so legacy text-only rows (from the mock
      // seeder that pre-dated this feature) still load. New rows created
      // via the controller always get a value — the controller enforces
      // that a media file be uploaded before insert.
      media_type: {
        type: DataTypes.STRING(16),
        allowNull: true,
        validate: {
          isValidMediaType(value) {
            if (value != null && !["image", "video"].includes(value)) {
              throw new Error("media_type must be image or video");
            }
          },
        },
      },
      // Path relative to the API root, e.g. `/uploads/announcements/xxx.jpg`.
      // The frontend prefixes this with `NEXT_PUBLIC_BASE_URL` (stripped of
      // any trailing `/api`) to reach the static file.
      media_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        validate: { min: 1, max: 3600 },
      },
      display_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // Only meaningful for videos. Kiosk browsers generally require muted
      // autoplay so leaving this false is the safe default.
      audio_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
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
      modelName: "Announcement",
      tableName: "announcements",
      timestamps: false,
      underscored: true,
    }
  );

  return Announcement;
};
