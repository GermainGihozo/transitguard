exports.createReport = async (req, res) => {
  const { title, description, location } = req.body;
  const userId = req.user.id;

  try {
    await db.query(
      "INSERT INTO reports (user_id, title, description, location) VALUES (?, ?, ?, ?)",
      [userId, title, description, location]
    );

    res.status(201).json({ message: "Report submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
