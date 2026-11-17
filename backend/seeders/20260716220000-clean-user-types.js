"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Wipes the placeholder `test_one`/`test_two`/`test_three` user types
 * from the initial dev seed and replaces them with the two categories
 * that actually make sense for the Office Guide admin:
 *
 *   - Admin: full-access operators (edit floors, offices, appearance,
 *     manage other users).
 *   - Staff: limited-access reviewers/editors.
 *
 * The migration is safe even if the admin user has `user_type_id = null`
 * (the current state on the live DB).
 */
const CURATED = [
  {
    name: "Admin",
    description:
      "Full-access administrators who manage the office guide, appearance, and other users.",
  },
  {
    name: "Staff",
    description:
      "Limited-access operators. Can maintain office/floor content but cannot alter users, roles, or permissions.",
  },
];

module.exports = {
  // NON-DESTRUCTIVE: runs on every container start, so it only inserts
  // user types that are missing and never deletes existing rows.
  async up(queryInterface) {
    const now = new Date();
    for (const t of CURATED) {
      await queryInterface.sequelize.query(
        `INSERT INTO user_types (user_type_id, name, description, created_at, updated_at)
         VALUES (:id, :name, :description, :now, :now)
         ON CONFLICT (name) DO NOTHING`,
        { replacements: { id: uuidv4(), name: t.name, description: t.description, now } }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("user_types", {
      name: CURATED.map((t) => t.name),
    });
  },
};
