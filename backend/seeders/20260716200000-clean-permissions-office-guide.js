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
  // NON-DESTRUCTIVE: runs on every container start, so it only inserts
  // permissions that are missing and never deletes existing rows.
  async up(queryInterface) {
    const now = new Date();
    for (const p of CURATED_PERMISSIONS) {
      await queryInterface.sequelize.query(
        `INSERT INTO permissions (permission_id, resource, action, is_active, created_at, updated_at)
         VALUES (:id, :resource, :action, true, :now, :now)
         ON CONFLICT (resource) DO NOTHING`,
        { replacements: { id: uuidv4(), resource: p.resource, action: p.action, now } }
      );
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
