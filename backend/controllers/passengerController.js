const db = require("../config/db");
const { encrypt } = require("../../utils/encryption");

// exports.registerPassenger = (req, res) => {
//   const { full_name, national_id, passport_number, phone, fingerprint_template } = req.body;

//   if (!full_name || !fingerprint_template) {
//     return res.status(400).json({ message: "Required fields missing" });
//   }

//   // Insert passenger
//   const passengerSql = `
//     INSERT INTO passengers (full_name, national_id, passport_number, phone,fingerprint_template)
//     VALUES (?, ?, ?, ?,?)
//   `;

//   db.query(
//     passengerSql,
//     [full_name, national_id, passport_number, phone, fingerprint_template],
//     (err, result) => {
//       if (err) return res.status(500).json(err);

//       const passengerId = result.insertId;

//       // Encrypt fingerprint
//       const encryptedTemplate = encrypt(fingerprint_template);

//       const biometricSql = `
//         INSERT INTO biometric_templates (passenger_id, encrypted_template, template_version)
//         VALUES (?, ?, ?)
//       `;

//       db.query(
//         biometricSql,
//         [passengerId, encryptedTemplate, "v1"],
//         (bioErr) => {
//           if (bioErr) return res.status(500).json(bioErr);

//           res.status(201).json({
//             message: "Passenger registered successfully",
//             passenger_id: passengerId
//           });
//         }
//       );
//     }
//   );
// };

exports.registerPassenger = (req, res) => {
  const {
    full_name,
    national_id,
    passport_number,
    phone,
    fingerprint_template,
    trip_id
  } = req.body;

  if (!full_name || !fingerprint_template) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const passengerSql = `
    INSERT INTO passengers
    (full_name, national_id, passport_number, phone, fingerprint_template)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    passengerSql,
    [full_name, national_id, passport_number, phone, fingerprint_template],
    (err, result) => {
      if (err) return res.status(500).json(err);

      const passengerId = result.insertId;

      // Create ticket if trip_id is provided
      if (trip_id) {
        const ticketSql = `
          INSERT INTO tickets (passenger_id, trip_id, is_used)
          VALUES (?, ?, 0)
        `;

        db.query(ticketSql, [passengerId, trip_id], (ticketErr) => {
          if (ticketErr) return res.status(500).json(ticketErr);

          return res.status(201).json({
            message: "Passenger registered and ticket assigned",
            passenger_id: passengerId
          });
        });
      } else {
        res.status(201).json({
          message: "Passenger registered successfully (no ticket)",
          passenger_id: passengerId
        });
      }
    }
  );
};