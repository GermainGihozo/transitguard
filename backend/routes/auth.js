const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

/* ================= REGISTER ================= */
// router.post("/register", async (req, res) => {
//   const { full_name, email, password, role } = req.body;

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const sql =
//       "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)";

//     db.query(sql, [full_name, email, hashedPassword, role], (err, result) => {
//       if (err) return res.status(500).json(err);

//       res.json({ message: "User registered successfully" });
//     });
//   } catch (error) {
//     res.status(500).json(error);
//   }
// });

// router.post("/register", async (req, res) => {
//   const { full_name, email, password, role, fingerprint_template } = req.body;

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const sql = `
//       INSERT INTO users 
//       (full_name, email, password_hash, fingerprint_template, role) 
//       VALUES (?, ?, ?, ?, ?)
//     `;

//     db.query(
//       sql,
//       [full_name, email, hashedPassword, fingerprint_template, role],
//       (err, result) => {
//         if (err) return res.status(500).json(err);

//         res.json({ message: "User registered with biometric successfully" });
//       }
//     );
//   } catch (error) {
//     res.status(500).json(error);
//   }
// });


router.post("/register", async (req, res) => {
  const { full_name, email, password, fingerprint_template } = req.body;

  const role = "conductor"; // default role

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users 
      (full_name, email, password_hash, fingerprint_template, role) 
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [full_name, email, hashedPassword, fingerprint_template, role],
      (err, result) => {
        if (err) {
          console.log(err); // 🔥 IMPORTANT for debugging
          return res.status(500).json({ message: "Database error", error: err });
        }

        res.json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});



/* ================= LOGIN ================= */
// router.post("/login", (req, res) => {
//   const { email, password } = req.body;

//   const sql = "SELECT * FROM users WHERE email = ?";
//   db.query(sql, [email], async (err, results) => {
//     if (err) return res.status(500).json(err);

//     if (results.length === 0)
//       return res.status(400).json({ message: "User not found" });

//     const user = results[0];

//     const isMatch = await bcrypt.compare(password, user.password_hash);
//     if (!isMatch)
//       return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user.id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user.id,
//         full_name: user.full_name,
//         role: user.role,
//       },
//     });
//   });
// });

// module.exports = router;

/* ================= BIOMETRIC LOGIN ================= */
router.post("/biometric-login", (req, res) => {
  const { email, fingerprint_template } = req.body;

  if (!email || !fingerprint_template) {
    return res.status(400).json({ message: "Email and fingerprint required" });
  }

  const { encrypt } = require("../utils/encryption");

  const encryptedIncoming = encrypt(fingerprint_template);

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = results[0];

    // if (user.fingerprint_template !== encryptedIncoming) {
    //   return res.status(401).json({ message: "Fingerprint mismatch" });
    // }

if (user.fingerprint_template !== fingerprint_template) {
  return res.status(401).json({ message: "Fingerprint mismatch" });
}


    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Biometric login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role
      }
    });
  });
});
module.exports = router;