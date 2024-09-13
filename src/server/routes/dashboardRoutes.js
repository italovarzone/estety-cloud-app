const express = require("express");
const {
  ensureDbConnection,
  authenticateToken,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Rota para o dashboard
router.get(
  "/api/dashboard",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    try {
      const totalAppointments = await db
        .collection("appointments")
        .countDocuments();
      const totalClients = await db.collection("clients").countDocuments();
      res.json({
        totalAppointments,
        totalClients,
      });
    } catch (err) {
      console.error("Erro ao carregar o dashboard:", err.message);
      res.status(500).json({ error: "Erro ao carregar o dashboard." });
    }
  }
);

module.exports = router;
