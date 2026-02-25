const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

require("./config/db");

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("TransitGuard API Running...");
});
const passengerRoutes = require("./routes/passengerRoutes");
app.use("/api/passengers", passengerRoutes);

const boardingRoutes = require("./routes/boardingRoutes");
app.use("/api/boarding", boardingRoutes);

app.use("/api/dashboard", require("./routes/dashboard"));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

