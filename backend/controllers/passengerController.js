const db = require("../config/db");
const { encryptTemplate } = require("../../utils/encryption");

exports.registerPassenger = (req, res) => {
  const { full_name, national_id, passport_number, phone, fingerprint_template } = req.body;

  if (!full_name || !fingerprint_template) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  // Insert passenger
  const passengerSql = `
    INSERT INTO passengers (full_name, national_id, passport_number, phone)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    passengerSql,
    [full_name, national_id, passport_number, phone],
    (err, result) => {
      if (err) return res.status(500).json(err);

      const passengerId = result.insertId;

      // Encrypt fingerprint
      const encryptedTemplate = encryptTemplate(fingerprint_template);

      const biometricSql = `
        INSERT INTO biometric_templates (passenger_id, encrypted_template, template_version)
        VALUES (?, ?, ?)
      `;

      db.query(
        biometricSql,
        [passengerId, encryptedTemplate, "v1"],
        (bioErr) => {
          if (bioErr) return res.status(500).json(bioErr);

          res.status(201).json({
            message: "Passenger registered successfully",
            passenger_id: passengerId
          });
        }
      );
    }
  );
};
