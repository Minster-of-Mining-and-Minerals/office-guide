"use strict";

/**
 * Extends the `announcements` table with the fields needed by the
 * full-screen digital-signage carousel that lives at /office-guide when
 * the `display_mode` setting is set to `announcements_only` or `both`.
 *
 * New columns:
 *   - media_type       : "image" | "video"
 *   - media_url        : path (relative to the API root) of the uploaded file
 *   - duration_seconds : how long an image is shown before advancing;
 *                        ignored for videos (they play to end)
 *   - display_order    : integer for admin-controlled sort order
 *   - audio_enabled    : whether videos should play with sound (default: false)
 *
 * The mock seeder produced text-only announcements; existing rows get
 * `media_type = 'image'` with a NULL `media_url` so they can be identified
 * and either deleted or updated with real media by the admin.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "announcements",
        "media_type",
        {
          type: Sequelize.STRING(16),
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        "announcements",
        "media_url",
        {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        "announcements",
        "duration_seconds",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 10,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        "announcements",
        "display_order",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        "announcements",
        "audio_enabled",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction: t }
      );

      // Message is now optional — an announcement can be pure media.
      await queryInterface.changeColumn(
        "announcements",
        "message",
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addIndex(
        "announcements",
        ["is_visible", "display_order"],
        { name: "announcements_visible_order_idx", transaction: t }
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeIndex(
        "announcements",
        "announcements_visible_order_idx",
        { transaction: t }
      );
      await queryInterface.changeColumn(
        "announcements",
        "message",
        {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        { transaction: t }
      );
      for (const col of [
        "audio_enabled",
        "display_order",
        "duration_seconds",
        "media_url",
        "media_type",
      ]) {
        await queryInterface.removeColumn("announcements", col, {
          transaction: t,
        });
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
