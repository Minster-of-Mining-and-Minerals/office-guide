"use strict";

const { User, Role, UserType, UserRoles, Permission, RolePermission } = require("../models");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

/**
 * Startup bootstrapper: makes sure the system is never left without a way
 * to log in. It creates the default admin (admin@gmail.com / password) with
 * Super Admin privileges ONLY when the users table is completely empty.
 *
 * It must NEVER modify existing users: this runs on every server start, and
 * resetting the admin's password/email here would undo changes made in the
 * admin panel (and re-open a known default password in production).
 */
async function ensureAdminUser() {
  try {
    const adminEmail = "admin@gmail.com";
    const userCount = await User.count();
    if (userCount > 0) {
      return; // Users exist — never touch them.
    }

    // 1. Ensure user type 'Admin' exists
    let adminType = await UserType.findOne({ where: { name: "Admin" } });
    if (!adminType) {
      adminType = await UserType.create({
        user_type_id: uuidv4(),
        name: "Admin",
        description: "Full-access administrators who manage the office guide, appearance, and other users.",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 2. Ensure role 'Super Admin' exists
    let superAdminRole = await Role.findOne({ where: { name: "Super Admin" } });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        role_id: uuidv4(),
        name: "Super Admin",
        description: "Unrestricted access. Can manage every resource including users, roles, and permissions.",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Link existing permissions to Super Admin role
      const allPermissions = await Permission.findAll();
      if (allPermissions.length > 0) {
        const rolePerms = allPermissions.map((p) => ({
          role_permission_id: uuidv4(),
          role_id: superAdminRole.role_id,
          permission_id: p.permission_id,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }));
        await RolePermission.bulkCreate(rolePerms, { ignoreDuplicates: true });
      }
    }

    // 3. Create the default admin (users table is empty here)
    const adminUser = await User.create({
      user_id: uuidv4(),
      full_name: "System Administrator",
      email: adminEmail,
      password: await bcrypt.hash("password", 10),
      phone_number: "+251911000001",
      profile_image: null,
      is_first_logged_in: false,
      is_active: true,
      user_type_id: adminType.user_type_id,
      password_changed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log(`✅ Default admin user '${adminEmail}' created (database had no users).`);

    // 4. Ensure Super Admin role assignment
    const userRoleExists = await UserRoles.findOne({
      where: { user_id: adminUser.user_id, role_id: superAdminRole.role_id },
    });

    if (!userRoleExists) {
      await UserRoles.create({
        user_role_id: uuidv4(),
        user_id: adminUser.user_id,
        role_id: superAdminRole.role_id,
        assigned_at: new Date(),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`✅ Assigned 'Super Admin' role to '${adminEmail}'.`);
    }
  } catch (err) {
    console.error("⚠️ Failed to ensure admin user on startup:", err.message);
  }
}

module.exports = { ensureAdminUser };
