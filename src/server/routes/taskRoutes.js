const express = require("express");
const { ObjectId } = require("mongodb");
const {
  ensureDbConnection,
  authenticateToken,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Rota para adicionar tarefa
router.post(
  "/api/tasks",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { name, date, time } = req.body; // Pegue o nome da tarefa, data e hora do corpo da requisição
    const userId = req.user.username; // Pegue o ID do usuário do token JWT (ou outra propriedade única)

    if (!name || !date || !time || !userId) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    try {
      // Inserção da tarefa no banco de dados MongoDB
      const result = await db
        .collection("tasks")
        .insertOne({ name, date, time, userId });
      res.status(201).json({
        id: result.insertedId,
        name,
        date,
        time,
        userId,
      });
    } catch (err) {
      console.error("Erro ao adicionar tarefa:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para listar tarefas
router.get(
  "/api/tasks",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const userId = req.user.username; // Use o ID do usuário autenticado
    const { status, date } = req.query; // Adicione o parâmetro de data aqui

    try {
      const query = { userId };

      // Adicione filtro de data, se fornecido
      if (date) {
        query.date = date;
      }

      // Adicione filtro de status, se fornecido
      if (status === "concluidas") {
        query.concluida = true;
      } else if (status === "nao-concluidas") {
        query.concluida = { $ne: true };
      }

      const tasks = await db.collection("tasks").find(query).toArray();
      res.json({ tasks });
    } catch (err) {
      console.error("Erro ao listar tarefas:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para concluir tarefa
router.put(
  "/api/tasks/:id/conclude",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.collection("tasks").updateOne(
        { _id: new ObjectId(id) },
        { $set: { concluida: true } } // Marca a tarefa como concluída
      );
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Tarefa não encontrada." });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao concluir tarefa:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para deletar tarefa
router.delete(
  "/api/tasks/:id",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db
        .collection("tasks")
        .deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Tarefa não encontrada." });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao deletar tarefa:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
