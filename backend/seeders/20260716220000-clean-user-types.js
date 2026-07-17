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
  async up(queryInterface, Sequelize) {
    const [existingUsers] = await queryInterface.sequelize.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE user_type_id IS NOT NULL`
    );
    const hasReferencedType = (existingUsers?.[0]?.n ?? 0) > 0;

    if (hasReferencedType) {
      // Someone assigned a user_type_id already — don't drop referenced
      // rows. Just insert the new ones with `ON CONFLICT DO NOTHING`
      // semantics (bulkInsert doesn't expose that, so we manually skip
      // duplicates by name).
      const now = new Date();
      for (const t of CURATED) {
        const [rows] = await queryInterface.sequelize.query(
          `SELECT 1 FROM user_types WHERE name = :name LIMIT 1`,
          { replacements: { name: t.name } }
        );
        if (rows.length === 0) {
          await queryInterface.bulkInsert("user_types", [
            {
              user_type_id: uuidv4(),
              name: t.name,
              description: t.description,
              created_at: now,
              updated_at: now,
            },
          ]);
        }
      }
      return;
    }

    // Safe to wipe — nobody references the placeholder types.
    await queryInterface.bulkDelete("user_types", null, {});
    const now = new Date();
    await queryInterface.bulkInsert(
      "user_types",
      CURATED.map((t) => ({
        user_type_id: uuidv4(),
        name: t.name,
        description: t.description,
        created_at: now,
        updated_at: now,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("user_types", {
      name: CURATED.map((t) => t.name),
    });
  },
};
