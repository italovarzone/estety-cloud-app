const express = require("express");
const moment = require('moment');
const { ObjectId } = require("mongodb");
const {
  ensureDbConnection,
  authenticateToken,
  normalizeText,
} = require("../middlewares/authMiddleware"); // Importando middlewares comuns

const router = express.Router();

// Rota para adicionar agendamento
router.post(
  "/api/appointments",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { clientId, procedureName, date, time } = req.body;

    if (!clientId || !procedureName || !date || !time) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    try {
      const db = req.db;
      const formattedDate = convertToDatabaseDate(date);

      const existingAppointment = await db
        .collection("appointments")
        .findOne({ date: formattedDate, time });
      if (existingAppointment) {
        return res
          .status(409)
          .json({ error: "Já existe um agendamento para este horário." });
      }

      const procedure = await db
        .collection("procedures")
        .findOne({ name: procedureName });

      if (!procedure) {
        return res
          .status(404)
          .json({ error: "Procedimento não encontrado." });
      }

      const result = await db.collection("appointments").insertOne({
        clientId: new ObjectId(clientId),
        procedure: procedure.name,
        date: formattedDate,
        time,
        concluida: false,
      });

      res.status(201).json({
        id: result.insertedId,
        clientId,
        procedure: procedure.name,
        date: formattedDate,
        time,
        concluida: false,
      });
    } catch (err) {
      console.error("Erro ao adicionar agendamento:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

function convertToDatabaseDate(date) {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
}


router.get(
  "/api/appointments",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { status, search, startDate, endDate } = req.query;
    try {
      const db = req.db;

      const query = {};

      // Filtra pelo status dos agendamentos
      if (status === "concluidos") {
        query.concluida = true;
      } else {
        query.concluida = { $ne: true };
      }

      // Se startDate e endDate são iguais, defina o range para o dia todo
      if (startDate && endDate) {
        const formattedStartDate = moment(startDate, "DD/MM/YYYY").startOf('day').format("YYYY-MM-DD");
        const formattedEndDate = moment(endDate, "DD/MM/YYYY").endOf('day').format("YYYY-MM-DD");

        // Se a mesma data for usada em startDate e endDate
        if (formattedStartDate === formattedEndDate) {
          query.date = {
            $gte: moment(startDate, "DD/MM/YYYY").startOf('day').format("YYYY-MM-DD"), // 00:00 do dia
            $lte: moment(endDate, "DD/MM/YYYY").endOf('day').format("YYYY-MM-DD"),   // 23:59 do mesmo dia
          };
        } else {
          // Intervalo de datas normais
          query.date = {
            $gte: formattedStartDate,
            $lte: formattedEndDate,
          };
        }
      }

      // Execute a consulta no MongoDB
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
            $lookup: {
              from: "procedures",
              localField: "procedure",
              foreignField: "name",
              as: "procedureDetails",
            },
          },
          { $unwind: { path: "$procedureDetails", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              id: "$_id",
              procedure: { $ifNull: ["$procedureDetails.name", "$procedure"] },
              date: 1,
              time: 1,
              "client.name": 1,
            },
          },
        ])
        .toArray();

      // Filtro por nome do cliente, se necessário
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

// Rota para listar agendamentos por cliente
router.get(
  '/api/appointments-by-client',
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      
      const appointmentsByClient = await db.collection('appointments').aggregate([
        {
          $lookup: {
            from: 'clients',
            localField: 'clientId',
            foreignField: '_id',
            as: 'client'
          }
        },
        { $unwind: '$client' },
        {
          $group: {
            _id: '$client._id',
            client_name: { $first: '$client.name' },
            appointment_count: { $sum: 1 }
          }
        }
      ]).toArray();

      res.json(appointmentsByClient); // Retorna a resposta em formato JSON
    } catch (err) {
      console.error('Erro ao carregar dados dos agendamentos por cliente:', err.message);
      res.status(500).json({ error: 'Erro ao carregar dados dos agendamentos.' }); // Resposta de erro padronizada
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
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const result = await db
        .collection("appointments")
        .deleteOne({ _id: new ObjectId(id) }); // Deleta o agendamento pelo ID

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ error: "Agendamento não encontrado." }); // Retorna erro se o agendamento não foi encontrado
      }

      res.json({
        success: true,
        message: "Agendamento deletado com sucesso.",
      }); // Retorna sucesso se o agendamento foi deletado
    } catch (err) {
      console.error("Erro ao deletar agendamento:", err.message); // Loga erro
      res.status(500).json({ error: "Erro ao deletar agendamento." }); // Retorna erro de servidor
    }
  }
);

module.exports = router;
