const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { validate } = require("../middleware/validator");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

/* ================= CREATE USER (Role-based) ================= */
router.post(
  "/create",
  authMiddleware,
  validate({
    full_name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, type: "email" },
    password: { required: true, type: "password" },
    role: { required: true },
    fingerprint_template: { required: true, minLength: 10 }
  }),
  async (req, res, next) => {
    const { full_name, email, password, role, fingerprint_template, station_id } = req.body;
    const creatorRole = req.user.role;

    try {
      // Role-based authorization logic
      const allowedRoles = {
        super_admin: ["company_admin"],
        company_admin: ["station_officer", "authority", "conductor"]
      };

      // Check if creator has permission to create this role
      if (!allowedRoles[creatorRole] || !allowedRoles[creatorRole].includes(role)) {
        return res.status(403).json({ 
          message: `${creatorRole} cannot create ${role} users`,
          allowed_roles: allowedRoles[creatorRole] || []
        });
      }

      // Check if user already exists
      const [existing] = await db.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users 
        (full_name, email, password_hash, fingerprint_template, role, station_id, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(sql, [
        full_name,
        email,
        hashedPassword,
        fingerprint_template,
        role,
        station_id || null,
        req.user.id
      ]);

      res.status(201).json({ 
        message: "User created successfully",
        user: {
          id: result.insertId,
          full_name,
          email,
          role,
          station_id: station_id || null
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= GET ALL USERS ================= */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  async (req, res, next) => {
    try {
      const { role, search, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      let sql = `
        SELECT 
          u.id, 
          u.full_name, 
          u.email, 
          u.role, 
          u.station_id, 
          u.is_active,
          u.created_at,
          creator.full_name as created_by_name
        FROM users u
        LEFT JOIN users creator ON u.created_by = creator.id
        WHERE 1=1
      `;
      const params = [];

      // Filter by role if provided
      if (role) {
        sql += " AND u.role = ?";
        params.push(role);
      }

      // Search by name or email
      if (search) {
        sql += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      // Company admins can only see users they created or lower roles
      if (req.user.role === "company_admin") {
        sql += " AND (u.created_by = ? OR u.role IN ('station_officer', 'authority', 'conductor'))";
        params.push(req.user.id);
      }

      sql += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      const [users] = await db.execute(sql, params);

      // Get total count
      let countSql = "SELECT COUNT(*) as total FROM users WHERE 1=1";
      const countParams = [];
      
      if (role) {
        countSql += " AND role = ?";
        countParams.push(role);
      }
      
      if (search) {
        countSql += " AND (full_name LIKE ? OR email LIKE ?)";
        countParams.push(`%${search}%`, `%${search}%`);
      }

      if (req.user.role === "company_admin") {
        countSql += " AND (created_by = ? OR role IN ('station_officer', 'authority', 'conductor'))";
        countParams.push(req.user.id);
      }

      const [countResult] = await db.execute(countSql, countParams);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= GET USER BY ID ================= */
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  async (req, res, next) => {
    try {
      const [users] = await db.execute(
        `SELECT 
          u.id, 
          u.full_name, 
          u.email, 
          u.role, 
          u.station_id, 
          u.is_active,
          u.created_at,
          u.updated_at,
          creator.full_name as created_by_name
        FROM users u
        LEFT JOIN users creator ON u.created_by = creator.id
        WHERE u.id = ?`,
        [req.params.id]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(users[0]);
    } catch (error) {
      next(error);
    }
  }
);

/* ================= UPDATE USER ================= */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  validate({
    full_name: { minLength: 2, maxLength: 100 },
    email: { type: "email" }
  }),
  async (req, res, next) => {
    try {
      const { full_name, email, station_id, is_active } = req.body;
      const userId = req.params.id;

      // Check if user exists
      const [existing] = await db.execute(
        "SELECT role, created_by FROM users WHERE id = ?",
        [userId]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Company admins can only update users they created
      if (req.user.role === "company_admin" && existing[0].created_by !== req.user.id) {
        return res.status(403).json({ message: "You can only update users you created" });
      }

      const updates = [];
      const params = [];

      if (full_name) {
        updates.push("full_name = ?");
        params.push(full_name);
      }

      if (email) {
        // Check if email is already taken
        const [emailCheck] = await db.execute(
          "SELECT id FROM users WHERE email = ? AND id != ?",
          [email, userId]
        );
        if (emailCheck.length > 0) {
          return res.status(409).json({ message: "Email already in use" });
        }
        updates.push("email = ?");
        params.push(email);
      }

      if (station_id !== undefined) {
        updates.push("station_id = ?");
        params.push(station_id);
      }

      if (is_active !== undefined) {
        updates.push("is_active = ?");
        params.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      params.push(userId);
      const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

      await db.execute(sql, params);

      res.json({ message: "User updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= DELETE/DEACTIVATE USER ================= */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  async (req, res, next) => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const [existing] = await db.execute(
        "SELECT role, created_by FROM users WHERE id = ?",
        [userId]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Company admins can only delete users they created
      if (req.user.role === "company_admin" && existing[0].created_by !== req.user.id) {
        return res.status(403).json({ message: "You can only delete users you created" });
      }

      // Prevent deleting super_admin
      if (existing[0].role === "super_admin") {
        return res.status(403).json({ message: "Cannot delete super admin" });
      }

      // Soft delete by deactivating
      await db.execute(
        "UPDATE users SET is_active = FALSE WHERE id = ?",
        [userId]
      );

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= RESET USER PASSWORD ================= */
router.post(
  "/:id/reset-password",
  authMiddleware,
  roleMiddleware("super_admin", "company_admin"),
  validate({
    new_password: { required: true, type: "password" }
  }),
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { new_password } = req.body;

      // Check if user exists
      const [existing] = await db.execute(
        "SELECT created_by FROM users WHERE id = ?",
        [userId]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Company admins can only reset passwords for users they created
      if (req.user.role === "company_admin" && existing[0].created_by !== req.user.id) {
        return res.status(403).json({ message: "You can only reset passwords for users you created" });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await db.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [hashedPassword, userId]
      );

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
