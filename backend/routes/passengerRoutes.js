const express = require("express");
const router = express.Router();
const { registerPassenger } = require("../controllers/passengerController");
const { verifyToken } = require("../../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post(
  "/register",
  verifyToken,
  authorizeRoles("station_officer", "company_admin", "super_admin"),
  registerPassenger
);
const db = require("../config/db");
const { encrypt } = require("../utils/encryption");

/* REGISTER PASSENGER WITH BIOMETRIC */
// router.post("/register", (req, res) => {
//   const {
//     full_name,
//     national_id,
//     passport_number,
//     phone,
//     fingerprint_template
//   } = req.body;

//   if (!full_name || !fingerprint_template) {
//     return res.status(400).json({
//       message: "Full name and fingerprint required"
//     });
//   }

//   const encryptedFingerprint = encrypt(fingerprint_template);

//   const sql = `
//     INSERT INTO passengers
//     (full_name, national_id, passport_number, phone, fingerprint_template)
//     VALUES (?, ?, ?, ?, ?)
//   `;

//   db.query(
//     sql,
//     [
//       full_name,
//       national_id,
//       passport_number,
//       phone,
//       encryptedFingerprint
//     ],
//     (err, result) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).json({
//           message: "Passenger registration failed",
//           error: err
//         });
//       }

//       res.json({
//         message: "Passenger registered successfully"
//       });
//     }
//   );
// });



router.post("/register", (req, res) => {
  const {
    full_name,
    national_id,
    passport_number,
    phone,
    fingerprint_template
  } = req.body;

  if (!full_name || !fingerprint_template) {
    return res.status(400).json({
      message: "Full name and fingerprint required"
    });
  }

  const encryptedFingerprint = encrypt(fingerprint_template);

  const sql = `
    INSERT INTO passengers
    (full_name, national_id, passport_number, phone, fingerprint_template)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      full_name,
      national_id,
      passport_number,
      phone,
      encryptedFingerprint
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({
        message: "Passenger registered successfully"
      });
    }
  );
});

module.exports = router;
