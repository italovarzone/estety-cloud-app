const express = require("express");
const { ObjectId } = require("mongodb");
const {
  ensureDbConnection,
  authenticateToken,
  normalizeText,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Rota para adicionar cliente
router.post(
  "/api/clients",
  ensureDbConnection,
  authenticateToken,
  async (req, res) => {
    const { name, birthdate, phone } = req.body;
    if (!name || !birthdate || !phone) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const result = await db
        .collection("clients")
        .insertOne({ name, birthdate, phone });
      res.json({ id: result.insertedId, name, birthdate, phone });
    } catch (err) {
      console.error("Erro ao adicionar cliente:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  "/api/clients",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const searchQuery = req.query.search ? normalizeText(req.query.search) : "";
    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const clients = await db.collection("clients").find({}).toArray();

      const filteredClients = clients.filter((client) => {
        const normalizedName = normalizeText(client.name);
        return normalizedName.startsWith(searchQuery);
      });

      res.json({ clients: filteredClients });
    } catch (err) {
      console.error("Erro ao listar clientes:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para editar cliente
router.put(
  "/api/clients/:id",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    const { name, birthdate, phone } = req.body;

    if (!name || !birthdate || !phone) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios" });
    }

    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const result = await db
        .collection("clients")
        .updateOne(
          { _id: new ObjectId(id) },
          { $set: { name, birthdate, phone } }
        );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      res.json({ success: true, message: "Cliente atualizado com sucesso." });
    } catch (err) {
      console.error("Erro ao editar cliente:", err.message);
      res.status(500).json({ error: "Erro ao editar cliente." });
    }
  }
);

// Rota para deletar um cliente
router.delete(
  "/api/clients/:id",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;

    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const result = await db
        .collection("clients")
        .deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      res.json({ success: true, message: "Cliente deletado com sucesso." });
    } catch (err) {
      console.error("Erro ao deletar cliente:", err.message);
      res.status(500).json({ error: "Erro ao deletar cliente." });
    }
  }
);

module.exports = router;
