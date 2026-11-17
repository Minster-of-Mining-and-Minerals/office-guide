"use strict";

/**
 * Announcements can now target several floors instead of one.
 *
 *  - `announcements.all_floors` (boolean): true = plays on every floor,
 *    including floors added later. Explicit flag so that deleting a floor
 *    never turns a floor-specific announcement into a global one.
 *  - `announcement_floors` join table: the chosen floors when
 *    `all_floors` is false.
 *
 * Existing data: rows with `floor_id IS NULL` ("Global") become
 * all_floors = true; rows with a floor keep that one floor.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "announcement_floors",
        {
          announcement_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            references: { model: "announcements", key: "announcement_id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          floor_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            references: { model: "floors", key: "floor_id" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn("NOW"),
          },
        },
        { transaction: t }
      );
      await queryInterface.addIndex("announcement_floors", ["floor_id"], {
        name: "announcement_floors_floor_id_idx",
        transaction: t,
      });

      await queryInterface.addColumn(
        "announcements",
        "all_floors",
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `INSERT INTO announcement_floors (announcement_id, floor_id, created_at)
         SELECT announcement_id, floor_id, NOW() FROM announcements WHERE floor_id IS NOT NULL`,
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `UPDATE announcements SET all_floors = (floor_id IS NULL)`,
        { transaction: t }
      );

      await queryInterface.removeColumn("announcements", "floor_id", {
        transaction: t,
      });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        "announcements",
        "floor_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: "floors", key: "floor_id" },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        { transaction: t }
      );
      // Best effort: a multi-floor announcement keeps its lowest floor.
      await queryInterface.sequelize.query(
        `UPDATE announcements a SET floor_id = (
           SELECT af.floor_id FROM announcement_floors af
           JOIN floors f ON f.floor_id = af.floor_id
           WHERE af.announcement_id = a.announcement_id
           ORDER BY f.floor_number LIMIT 1)
         WHERE a.all_floors = false`,
        { transaction: t }
      );
      await queryInterface.removeColumn("announcements", "all_floors", {
        transaction: t,
      });
      await queryInterface.dropTable("announcement_floors", { transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
