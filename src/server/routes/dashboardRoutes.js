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
      const db = req.db; // Use 'req.db' para acessar o banco de dados

      // Obter total de agendamentos e clientes
      const totalAppointments = await db
        .collection("appointments")
        .countDocuments();
      const totalClients = await db.collection("clients").countDocuments();

      // Contar os top 3 procedimentos mais usados em agendamentos com base na descrição
      const topProcedures = await db.collection("appointments").aggregate([
        {
          $group: {
            _id: "$procedure", // Agrupa pela descrição do procedimento
            count: { $sum: 1 }, // Conta o número de ocorrências
          },
        },
        {
          $sort: { count: -1 }, // Ordena pela contagem em ordem decrescente
        },
        {
          $limit: 3, // Limita aos top 3 procedimentos
        },
        {
          $project: {
            _id: 0,
            procedureName: "$_id", // Usa o valor do agrupamento como nome do procedimento
            count: 1, // Contagem de agendamentos
          },
        },
      ]).toArray();

      res.json({
        totalAppointments,
        totalClients,
        topProcedures,
      });
    } catch (err) {
      console.error("Erro ao carregar o dashboard:", err.message);
      res.status(500).json({ error: "Erro ao carregar o dashboard." });
    }
  }
);

module.exports = router;
