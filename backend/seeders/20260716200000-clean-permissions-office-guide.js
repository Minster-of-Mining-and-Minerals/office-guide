"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Resets the `permissions` table to only the resources the Office Guide
 * admin actually uses today. Any legacy issue-tracker permissions
 * (organizations, projects, issues, human_resources, etc.) or removed
 * features (`displays`, `announcements`, `signage:read`) are wiped.
 *
 * NOTE: the `permissions` table has a UNIQUE constraint on `resource` alone
 * (not the composite `(resource, action)`), so we keep exactly one row per
 * resource here. If the constraint is loosened later, fine-grained
 * (create/read/update/delete) rows can be added on top of this seed.
 */
const CURATED_PERMISSIONS = [
  { resource: "dashboard", action: "view" },
  { resource: "floors", action: "manage" },
  { resource: "offices", action: "manage" },
  { resource: "appearance", action: "manage" },
  { resource: "users", action: "manage" },
  { resource: "roles", action: "manage" },
  { resource: "permissions", action: "manage" },
];

module.exports = {
  async up(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // Drop join rows first so the parent delete can proceed without
      // FK errors, then wipe every permission row. `role_permissions`
      // is re-populated by the role-management UI after this seed.
      await queryInterface.bulkDelete(
        "role_permissions",
        null,
        { transaction: t }
      );
      await queryInterface.bulkDelete("permissions", null, { transaction: t });

      const now = new Date();
      await queryInterface.bulkInsert(
        "permissions",
        CURATED_PERMISSIONS.map((p) => ({
          permission_id: uuidv4(),
          resource: p.resource,
          action: p.action,
          is_active: true,
          created_at: now,
          updated_at: now,
        })),
        { transaction: t }
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    // Only remove the curated set on rollback — anything an operator added
    // manually stays put.
    await queryInterface.bulkDelete("permissions", {
      resource: {
        [Sequelize.Op.in]: CURATED_PERMISSIONS.map((p) => p.resource),
      },
    });
  },
};
