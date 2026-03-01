const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { validate } = require("../middleware/validator");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

/* ================= REGISTER (Disabled - Use /users/create instead) ================= */
// This endpoint is kept for backward compatibility but should not be used
// Use POST /api/users/create with proper authentication instead
router.post(
  "/register",
  authLimiter,
  validate({
    full_name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, type: "email" },
    password: { required: true, type: "password" },
    fingerprint_template: { required: true, minLength: 10 }
  }),
  async (req, res, next) => {
    // Disable public registration
    return res.status(403).json({ 
      message: "Public registration is disabled. Please contact your administrator.",
      info: "Super admins create company admins, company admins create other users"
    });

    /* Original registration code kept for reference
    const { full_name, email, password, fingerprint_template } = req.body;
    const role = req.body.role || "conductor";

    try {
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
        (full_name, email, password_hash, fingerprint_template, role) 
        VALUES (?, ?, ?, ?, ?)
      `;

      await db.execute(sql, [
        full_name,
        email,
        hashedPassword,
        fingerprint_template,
        role
      ]);

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      next(error);
    }
    */
  }
);

/* ================= LOGIN ================= */
router.post(
  "/login",
  authLimiter,
  validate({
    email: { required: true, type: "email" },
    password: { required: true }
  }),
  async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const [results] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (results.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid email or password. Please check your credentials and try again." 
        });
      }

      const user = results[0];

      if (!user.is_active) {
        return res.status(403).json({ 
          success: false,
          message: "Your account has been deactivated. Please contact your administrator." 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid email or password. Please check your credentials and try again." 
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, station_id: user.station_id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          role: user.role,
          station_id: user.station_id
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/* ================= BIOMETRIC LOGIN ================= */
router.post(
  "/biometric-login",
  authLimiter,
  validate({
    email: { required: true, type: "email" },
    fingerprint_template: { required: true, minLength: 10 }
  }),
  async (req, res, next) => {
    const { email, fingerprint_template } = req.body;

    try {
      const [results] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (results.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: "Invalid email or fingerprint. Please check your credentials and try again." 
        });
      }

      const user = results[0];

      if (!user.is_active) {
        return res.status(403).json({ 
          success: false,
          message: "Your account has been deactivated. Please contact your administrator." 
        });
      }

      // Compare fingerprint templates
      // TODO: Replace with actual biometric matching algorithm
      if (user.fingerprint_template !== fingerprint_template) {
        return res.status(401).json({ 
          success: false,
          message: "Biometric verification failed. Fingerprint does not match." 
        });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, station_id: user.station_id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        success: true,
        message: "Biometric login successful",
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          role: user.role,
          station_id: user.station_id
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
