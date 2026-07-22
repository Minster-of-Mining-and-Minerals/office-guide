const { User, Role, RolePermission, Permission } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const rawEmail = (req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "").trim();

    if (!rawEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      where: { email: rawEmail },
      include: [
        {
          model: Role,
          as: "roles",
          through: { attributes: [] },
          required: false,
          include: [
            {
              model: RolePermission,
              as: "rolePermissions",
              required: false,
              include: [
                {
                  model: Permission,
                  as: "permission",
                  attributes: ["permission_id", "resource", "action"],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!user) {
      console.warn(`[auth.login] No user found for email: '${rawEmail}'`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.is_active) {
      console.warn(`[auth.login] User '${rawEmail}' is inactive`);
      return res.status(403).json({ message: "User is inactive" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[auth.login] Password mismatch for user '${rawEmail}'`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ===== Clean roles + permissions for token use =====
    const userRoles = (user.roles || []).map((role) => ({
      role_id: role.role_id,
      name: role.name,
      permissions: (role.rolePermissions || [])
        .map((rp) => ({
          permission_id: rp.permission_id,
          resource: rp.permission?.resource,
          action: rp.permission?.action,
        }))
        .filter((p) => p.resource && p.action),
    }));

    // ===== Generate JWT Token =====
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        roles: userRoles.map((r) => r.name),
        permissions: userRoles.flatMap((r) => r.permissions),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Update last login
    await User.update(
      { last_login_at: new Date() },
      { where: { user_id: user.user_id } }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          profile_image: user.profile_image,
          is_first_logged_in: user.is_first_logged_in,
        },
        roles: userRoles,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Logout (token invalidation example using a blacklist)
const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { login, logout };
