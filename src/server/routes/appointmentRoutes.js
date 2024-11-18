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

      // Verifique se o procedimento existe e obtenha sua duração
      const procedure = await db.collection("procedures").findOne({ name: procedureName });

      if (!procedure) {
        return res.status(404).json({ error: "Procedimento não encontrado." });
      }

      const procedureDuration = procedure.duration; // Duração do procedimento em minutos

      // Converta o horário inicial para minutos para comparação
      const [hours, minutes] = time.split(":").map(Number);
      const requestedStartMinutes = hours * 60 + minutes;
      const requestedEndMinutes = requestedStartMinutes + procedureDuration;

      // Verifique todos os agendamentos não concluídos na data fornecida
      const appointmentsOnDate = await db.collection("appointments").find({
        date: formattedDate,
        concluida: false
      }).toArray();

      // Variável para armazenar o horário disponível antes do conflito
      let availableTimeBeforeConflict = null;

      // Verifique se há conflitos com base na duração dos procedimentos existentes
      for (const appointment of appointmentsOnDate) {
        // Obtenha a duração do procedimento associado ao agendamento
        const existingProcedure = await db.collection("procedures").findOne({ name: appointment.procedure });
        if (!existingProcedure) {
          continue; // Ignore se o procedimento não for encontrado
        }

        const existingDuration = existingProcedure.duration;
        const [existingHours, existingMinutes] = appointment.time.split(":").map(Number);
        const existingStartMinutes = existingHours * 60 + existingMinutes;
        const existingEndMinutes = existingStartMinutes + existingDuration;

        // Calcular a janela de segurança antes do início do agendamento existente
        const safeBufferStart = existingStartMinutes - procedureDuration + 1;

        let horarioDisponivelEmMinutos = convertTimeToMinutes(appointment.time) - procedureDuration;

        // Verificar se há sobreposição de horários ou se o novo agendamento está dentro da janela de segurança
        if (
          (requestedStartMinutes >= existingStartMinutes && requestedStartMinutes < existingEndMinutes) || // Novo início está dentro do intervalo existente
          (requestedEndMinutes > existingStartMinutes && requestedEndMinutes <= existingEndMinutes) || // Novo fim está dentro do intervalo existente
          (requestedStartMinutes <= existingStartMinutes && requestedEndMinutes >= existingEndMinutes) || // Novo intervalo engloba o intervalo existente
          (requestedStartMinutes >= safeBufferStart && requestedStartMinutes < existingStartMinutes) // Novo início está dentro da janela de segurança
        ) {
          // Calcular o horário disponível antes do conflito
          availableTimeBeforeConflict = convertMinutesToTime(safeBufferStart);

          return res.status(409).json({
            error: `O horário solicitado conflita com outro agendamento das ${appointment.time} até ${convertMinutesToTime(existingEndMinutes)} ou está dentro de uma janela de segurança! Tente as ${convertMinutesToTime(horarioDisponivelEmMinutos)} ou após as ${convertMinutesToTime(existingEndMinutes)}.`
          });
        }
      }

      // Insira o novo agendamento se não houver conflitos
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

function convertTimeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Função para converter minutos em formato de "HH:MM"
function convertMinutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function convertToDatabaseDate(date) {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
}

router.get("/api/appointments/calendario", authenticateToken, ensureDbConnection, async (req, res) => {
  const { status, date } = req.query;
  try {
    const db = req.db;
    const query = {};

    // Filtro opcional de data
    if (date) {
      query.date = date;
    }

    // Filtro opcional de status
    if (status === "concluidos") {
      query.concluida = true;
    }

    const appointments = await db.collection("appointments").aggregate([
      { $match: query },
      {
        $lookup: {
          from: "clients",            // Nome da coleção de clientes
          localField: "clientId",      // Campo em "appointments" que referencia o cliente
          foreignField: "_id",         // Campo em "clients" que corresponde ao "clientId"
          as: "clientData"             // Nome do campo resultante com os dados do cliente
        }
      },
      { $unwind: "$clientData" },      // Descompacta o array clientData para um objeto único
      {
        $project: {
          _id: 1,
          date: 1,
          time: 1,
          procedure: 1,
          concluida: 1,
          "client.name": "$clientData.name" // Inclui apenas o nome do cliente
        }
      }
    ]).toArray();

    res.json({ appointments });
  } catch (err) {
    console.error("Erro ao listar agendamentos:", err.message);
    res.status(500).json({ error: err.message });
  }
});

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
            price: "$procedureDetails.price", // Inclui o preço do procedimento
            date: 1,
            time: 1,
            "client.name": 1,
            expired: { $lt: ["$date", currentDate.toISOString().split('T')[0]] },
          },
        },
        {
          $sort: status === "concluidos"
            ? { date: -1, time: 1 }
            : { date: 1, time: 1 }
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
// router.put(
//   "/api/appointments/:id/reschedule",
//   authenticateToken,
//   ensureDbConnection,
//   async (req, res) => {
//     const { id } = req.params;
//     const { date, time } = req.body;

//     if (!date || !time) {
//       return res.status(400).json({ error: "Data e hora são obrigatórias." });
//     }

//     try {
//       const db = req.db;
//       const result = await db
//         .collection("appointments")
//         .updateOne({ _id: new ObjectId(id) }, { $set: { date, time } });

//       if (result.modifiedCount === 0) {
//         return res.status(404).json({ error: "Agendamento não encontrado." });
//       }
//       res.json({ success: true });
//     } catch (err) {
//       console.error("Erro ao reagendar agendamento:", err.message);
//       res.status(500).json({ error: "Erro ao reagendar agendamento." });
//     }
//   }
// );

// Rota para concluir agendamento
router.put(
  "/api/appointments/:id/conclude",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
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
