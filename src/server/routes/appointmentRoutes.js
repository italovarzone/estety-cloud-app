const express = require("express");
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


// Rota para listar agendamentos
router.get(
  "/api/appointments/calendario",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { status, date, search } = req.query;
    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados

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
            $lookup: {
              from: "procedures", // Faz o lookup na coleção 'procedures'
              localField: "procedure", // Campo de referência no agendamento (o nome, não o ID)
              foreignField: "name", // Campo de referência na coleção de procedimentos (pelo nome)
              as: "procedureDetails", // Nome alternativo para os detalhes do procedimento
            },
          },
          { $unwind: { path: "$procedureDetails", preserveNullAndEmptyArrays: true } }, // Mantém o documento se não houver correspondência
          {
            $project: {
              id: "$_id",
              procedure: { $ifNull: ["$procedureDetails.name", "$procedure"] }, // Se não encontrar, usa o nome armazenado no agendamento
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

// Rota para listar agendamentos
router.get(
  "/api/appointments",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { status, search, olderThan20Days } = req.query;

    const currentDate = new Date();
    const twentyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 15)).toISOString().split('T')[0]; // Data de 15 dias atrás

    try {
      const db = req.db;
      const query = {};

      // Filtra por status "concluído" ou "não concluído"
      if (status === "concluidos") {
        query.concluida = true; // Agendamentos concluídos

        // Adiciona o filtro "há mais de 20 dias" se o parâmetro for verdadeiro
        if (olderThan20Days === 'true') {
          query.date = { $lt: twentyDaysAgo }; // Filtra datas menores que a data de 20 dias atrás
        }
      } else {
        query.concluida = { $ne: true }; // Agendamentos não concluídos
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
              time: 1,  // Inclui o campo time (hora) na consulta
              "client.name": 1,
              expired: { $lt: ["$date", currentDate.toISOString().split('T')[0]] }, // Verifica se o agendamento está vencido
            },
          },
          // Ordena dependendo do status
          {
            $sort: status === "concluidos"
              ? { date: -1, time: 1 }  // Para "concluídos", ordena pela data decrescente e hora crescente
              : { date: 1, time: 1 }   // Para "não concluídos", ordena pela data e hora crescente
          }
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

// Verificação no backend ao reagendar ou adicionar um agendamento
router.put(
  "/api/appointments/:id/reschedule",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: "Data e hora são obrigatórias." });
    }

    try {
      const db = req.db;

      // Verifica se já existe um agendamento não concluído com a mesma data e hora
      const conflictingAppointment = await db
        .collection("appointments")
        .findOne({
          date,
          time,
          concluida: false,
          _id: { $ne: new ObjectId(id) } // Exclui o próprio agendamento (se for edição)
        });

      if (conflictingAppointment) {
        return res.status(409).json({ error: "Já existe um agendamento não concluído neste horário." });
      }

      const result = await db
        .collection("appointments")
        .updateOne({ _id: new ObjectId(id) }, { $set: { date, time } });

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao reagendar agendamento:", err.message);
      res.status(500).json({ error: "Erro ao reagendar agendamento." });
    }
  }
);

// Endpoint para verificar disponibilidade de horário
router.get(
  "/api/appointments/check-availability",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({ available: false, error: "Data e hora são obrigatórias." });
    }

    try {
      const db = req.db;
      const existingAppointment = await db
        .collection("appointments")
        .findOne({ date, time, concluida: false });

      if (existingAppointment) {
        return res.json({ available: false });
      }

      res.json({ available: true });
    } catch (err) {
      console.error("Erro ao verificar disponibilidade de horário:", err.message);
      res.status(500).json({ available: false, error: "Erro ao verificar disponibilidade." });
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

// Rota para reagendar um agendamento
router.put(
  "/api/appointments/:id/reschedule",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: "Data e hora são obrigatórias." });
    }

    try {
      const db = req.db;
      const result = await db
        .collection("appointments")
        .updateOne({ _id: new ObjectId(id) }, { $set: { date, time } });

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao reagendar agendamento:", err.message);
      res.status(500).json({ error: "Erro ao reagendar agendamento." });
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
