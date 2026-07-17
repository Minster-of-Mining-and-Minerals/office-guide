"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Seeds permission entries for the Office Guide / Digital Signage feature.
 *
 * NOTE: The existing `permissions` table has a pre-existing UNIQUE constraint
 * on `resource` alone (not on the composite (resource, action)). To stay
 * consistent with that constraint we register one "manage" entry per new
 * resource. Fine-grained (create/read/update/delete) rows will fail with
 * SequelizeUniqueConstraintError until that constraint is loosened.
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const resources = [
      { resource: "floors", action: "manage" },
      { resource: "offices", action: "manage" },
      { resource: "displays", action: "manage" },
      { resource: "signage", action: "read" },
    ];

    for (const perm of resources) {
      try {
        await queryInterface.bulkInsert(
          "permissions",
          [
            {
              permission_id: uuidv4(),
              resource: perm.resource,
              action: perm.action,
              is_active: true,
              created_at: now,
              updated_at: now,
            },
          ],
          { ignoreDuplicates: true }
        );
      } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
          console.log(
            `Permission ${perm.resource}:${perm.action} already exists, skipping...`
          );
          continue;
        }
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("permissions", {
      resource: {
        [Sequelize.Op.in]: ["floors", "offices", "displays", "signage"],
      },
    });
  },
};
