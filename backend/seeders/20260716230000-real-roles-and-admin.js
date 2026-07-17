"use strict";

/**
 * Reseeds users and roles with real, meaningful data for the
 * Ministry of Mining digital signage / office guide admin panel.
 *
 * Wipes:
 *   - Every existing row in `roles` (cascades to role_permissions +
 *     user_roles thanks to ON DELETE CASCADE — see migrations).
 *   - Every existing row in `users` (cascades to user_roles).
 *
 * Inserts four production-ready roles wired to the 7 curated
 * permissions in `permissions` (dashboard:view, floors:manage,
 * offices:manage, appearance:manage, users:manage, roles:manage,
 * permissions:manage):
 *
 *   1. Super Admin        — full access (all 7 permissions)
 *   2. Content Editor     — dashboard + floors + offices
 *   3. Appearance Manager — dashboard + appearance
 *   4. User Manager       — dashboard + users + roles + permissions
 *
 * Inserts one real admin user and assigns them Super Admin:
 *
 *   - Email:    admin@gmail.com
 *   - Password: password  (dev default — matches the createUser controller)
 *   - Type:     Admin (from the earlier user_types seed)
 *   - is_first_logged_in: false (log straight in — the seeded
 *     password is known and safe for internal use)
 *
 * Idempotent-ish: safe to re-run after `db:seed:undo`. Not safe to
 * run twice in a row without undoing first (the `up` block wipes
 * both tables before inserting).
 */

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

/** Human-readable role definitions, resolved to permission IDs at run time. */
const ROLE_DEFINITIONS = [
  {
    name: "Super Admin",
    description:
      "Unrestricted access. Can manage every resource including users, roles, and permissions.",
    permissionKeys: [
      "dashboard:view",
      "floors:manage",
      "offices:manage",
      "appearance:manage",
      "users:manage",
      "roles:manage",
      "permissions:manage",
    ],
  },
  {
    name: "Content Editor",
    description:
      "Maintains the office guide content — floors and offices — but cannot alter theming, users, or permissions.",
    permissionKeys: ["dashboard:view", "floors:manage", "offices:manage"],
  },
  {
    name: "Appearance Manager",
    description:
      "Owns the public theme (colors, presets, live preview). Read-only elsewhere.",
    permissionKeys: ["dashboard:view", "appearance:manage"],
  },
  {
    name: "User Manager",
    description:
      "Runs the identity module — creates users, assigns roles, and edits the permission catalog.",
    permissionKeys: [
      "dashboard:view",
      "users:manage",
      "roles:manage",
      "permissions:manage",
    ],
  },
];

/** Sensible default admin identity for internal QA / demo. */
const ADMIN_USER = {
  full_name: "System Administrator",
  email: "admin@gmail.com",
  phone_number: "+251911000001",
  // Plaintext password — hashed with bcrypt (cost 10) at insert time.
  // Matches the dev default used by the createUser controller so any
  // user created through the admin UI also has `password` as their
  // temp password. Change this before any production deploy.
  plaintextPassword: "password",
  roleName: "Super Admin",
  userTypeName: "Admin",
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── 1. Resolve permission keys → permission_id ──
    const [permissionRows] = await queryInterface.sequelize.query(
      `SELECT permission_id, resource, action FROM permissions`
    );
    const permissionIdByKey = new Map(
      permissionRows.map((p) => [`${p.resource}:${p.action}`, p.permission_id])
    );

    // Fail loudly if the required permissions aren't seeded yet — better
    // than silently creating a Super Admin with no permissions.
    const requiredKeys = new Set(
      ROLE_DEFINITIONS.flatMap((r) => r.permissionKeys)
    );
    const missing = [...requiredKeys].filter((k) => !permissionIdByKey.has(k));
    if (missing.length) {
      throw new Error(
        `Cannot seed roles: missing permissions in DB → ${missing.join(", ")}. ` +
          `Run the permissions seeder first (20260716200000-clean-permissions-office-guide.js).`
      );
    }

    // ── 2. Resolve Admin user_type ──
    const [userTypeRows] = await queryInterface.sequelize.query(
      `SELECT user_type_id FROM user_types WHERE name = :n LIMIT 1`,
      { replacements: { n: ADMIN_USER.userTypeName } }
    );
    const adminUserTypeId = userTypeRows?.[0]?.user_type_id;
    if (!adminUserTypeId) {
      throw new Error(
        `Cannot seed admin: user_type '${ADMIN_USER.userTypeName}' does not exist. ` +
          `Run the user-types seeder first (20260716220000-clean-user-types.js).`
      );
    }

    // ── 3. Wipe the identity tables (CASCADEs handle joins) ──
    // Use TRUNCATE ... CASCADE so soft-deleted junk (`deleted_at IS NOT NULL`)
    // is also cleared — bulkDelete respects paranoid deletes and would skip
    // those rows, leaving orphans.
    await queryInterface.sequelize.query(
      `TRUNCATE TABLE user_roles, users, role_permissions, roles RESTART IDENTITY CASCADE`
    );

    // ── 4. Insert real roles ──
    const roleRows = ROLE_DEFINITIONS.map((def) => ({
      role_id: uuidv4(),
      name: def.name,
      description: def.description,
      is_active: true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }));
    await queryInterface.bulkInsert("roles", roleRows);

    const roleIdByName = new Map(roleRows.map((r) => [r.name, r.role_id]));

    // ── 5. Insert role_permissions join rows ──
    const rolePermRows = ROLE_DEFINITIONS.flatMap((def) =>
      def.permissionKeys.map((key) => ({
        role_permission_id: uuidv4(),
        role_id: roleIdByName.get(def.name),
        permission_id: permissionIdByKey.get(key),
        is_active: true,
        created_at: now,
        updated_at: now,
      }))
    );
    await queryInterface.bulkInsert("role_permissions", rolePermRows);

    // ── 6. Insert the admin user ──
    const passwordHash = await bcrypt.hash(ADMIN_USER.plaintextPassword, 10);
    const adminUserId = uuidv4();
    await queryInterface.bulkInsert("users", [
      {
        user_id: adminUserId,
        full_name: ADMIN_USER.full_name,
        email: ADMIN_USER.email,
        password: passwordHash,
        phone_number: ADMIN_USER.phone_number,
        profile_image: null,
        // `false` → they can log straight in. If the frontend later
        // implements a "force change temp password" gate, this flag is
        // how it decides. Real users created via the UI still start
        // with `true` since the API generates a random password for them.
        is_first_logged_in: false,
        last_login_at: null,
        password_changed_at: now,
        is_active: true,
        user_type_id: adminUserTypeId,
        created_at: now,
        updated_at: now,
      },
    ]);

    // ── 7. Assign Super Admin role to the admin user ──
    await queryInterface.bulkInsert("user_roles", [
      {
        user_role_id: uuidv4(),
        user_id: adminUserId,
        role_id: roleIdByName.get(ADMIN_USER.roleName),
        assigned_by: null,
        assigned_at: now,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    // Reversal is best-effort: just wipe. CASCADE handles the joins.
    await queryInterface.sequelize.query(
      `TRUNCATE TABLE user_roles, users, role_permissions, roles RESTART IDENTITY CASCADE`
    );
  },
};
