const express = require("express");
const { ObjectId } = require("mongodb");
const {
  ensureDbConnection,
  authenticateToken,
  normalizeText,
} = require("../middlewares/authMiddleware"); // Importando middlewares comuns

const router = express.Router();

router.post(
  "/api/appointments",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { clientId, procedure, date, time } = req.body;

    if (!clientId || !procedure || !date || !time) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    try {
      const existingAppointment = await db
        .collection("appointments")
        .findOne({ date, time });
      if (existingAppointment) {
        return res
          .status(409)
          .json({ error: "Já existe um agendamento para este horário." });
      }

      const result = await db.collection("appointments").insertOne({
        clientId: new ObjectId(clientId),
        procedure,
        date,
        time,
        concluida: false,
      });
      res.status(201).json({
        id: result.insertedId,
        clientId,
        procedure,
        date,
        time,
        concluida: false,
      });
    } catch (err) {
      console.error("Erro ao adicionar agendamento:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para listar agendamentos
router.get(
  "/api/appointments",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { status, date, search } = req.query;
    try {
      const query = {};

      if (date) {
        query.date = date;
      }

      if (status === "concluidos") {
        query.concluida = true;
      } else {
        query.concluida = { $ne: true };
      }

      const appointments = await db
        .collection("appointments")
        .aggregate([
          { $match: query },
          {
            $lookup: {
              from: "clients",
              localField: "clientId",
              foreignField: "_id",
              as: "client",
            },
          },
          { $unwind: "$client" },
          {
            $project: {
              id: "$_id",
              procedure: 1,
              date: 1,
              time: 1,
              "client.name": 1,
            },
          },
        ])
        .toArray();

      const filteredAppointments = search
        ? appointments.filter((appointment) => {
            const normalizedClientName = normalizeText(appointment.client.name);
            const normalizedSearch = normalizeText(search);
            return normalizedClientName.startsWith(normalizedSearch);
          })
        : appointments;

      res.json({ appointments: filteredAppointments });
    } catch (err) {
      console.error("Erro ao listar agendamentos:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para concluir agendamento
router.put(
  "/api/appointments/:id/conclude",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db
        .collection("appointments")
        .updateOne({ _id: new ObjectId(id) }, { $set: { concluida: true } });
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao concluir agendamento:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para deletar um agendamento
router.delete(
  "/api/appointments/:id",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params; // Obtenha o ID do agendamento dos parâmetros da URL

    try {
      const result = await db
        .collection("appointments")
        .deleteOne({ _id: new ObjectId(id) }); // Deleta o agendamento pelo ID

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado." }); // Retorna erro se o agendamento não foi encontrado
      }

      res.json({ success: true, message: "Agendamento deletado com sucesso." }); // Retorna sucesso se o agendamento foi deletado
    } catch (err) {
      console.error("Erro ao deletar agendamento:", err.message); // Loga erro
      res.status(500).json({ error: "Erro ao deletar agendamento." }); // Retorna erro de servidor
    }
  }
);

// Rota para listar agendamentos por cliente
router.get(
  "/api/appointments-by-client",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    try {
      const appointmentsByClient = await db
        .collection("appointments")
        .aggregate([
          {
            $lookup: {
              from: "clients",
              localField: "clientId",
              foreignField: "_id",
              as: "client",
            },
          },
          { $unwind: "$client" },
          {
            $group: {
              _id: "$client._id",
              client_name: { $first: "$client.name" },
              appointment_count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      res.json(appointmentsByClient);
    } catch (err) {
      console.error(
        "Erro ao carregar dados dos agendamentos por cliente:",
        err.message
      );
      res
        .status(500)
        .json({ error: "Erro ao carregar dados dos agendamentos." });
    }
  }
);

module.exports = router;
