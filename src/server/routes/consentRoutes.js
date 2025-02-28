const express = require("express");
const { ObjectId } = require("mongodb");
const { ensureDbConnection, authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rota para obter o termo de consentimento existente
router.get(
  "/api/consent",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const consentData = await db.collection("consent_terms").findOne({}); // Busca o termo de consentimento

      if (!consentData) {
        return res.status(404).json({ error: "Termo de consentimento não encontrado." });
      }

      res.json({ consentMessage: consentData.consentMessage });
    } catch (err) {
      console.error("Erro ao obter o termo de consentimento:", err.message);
      res.status(500).json({ error: "Erro ao obter o termo de consentimento." });
    }
  }
);

// Rota para criar um novo termo de consentimento
router.post(
  "/api/consent",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { consentMessage } = req.body;

    // Verificação dos campos obrigatórios
    if (!consentMessage || consentMessage.trim() === "") {
      return res.status(400).json({ error: "O termo de consentimento não pode estar vazio." });
    }

    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados

      // Remover todos os termos existentes (opcional: permite apenas um termo)
      await db.collection("consent_terms").deleteMany({});

      // Inserir o novo termo de consentimento
      const result = await db.collection("consent_terms").insertOne({
        consentMessage,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({
        id: result.insertedId,
        consentMessage,
      });
    } catch (err) {
      console.error("Erro ao criar o termo de consentimento:", err.message);
      res.status(500).json({ error: "Erro ao criar o termo de consentimento." });
    }
  }
);

// Rota para atualizar o termo de consentimento existente
router.put(
  "/api/consent/:id",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const { id } = req.params;
    const { consentMessage } = req.body;

    // Verificação dos campos obrigatórios
    if (!consentMessage || consentMessage.trim() === "") {
      return res.status(400).json({ error: "O termo de consentimento não pode estar vazio." });
    }

    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const result = await db.collection("consent_terms").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            consentMessage,
            updatedAt: new Date(),
          },
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Termo de consentimento não encontrado." });
      }

      res.json({ success: true, consentMessage });
    } catch (err) {
      console.error("Erro ao atualizar o termo de consentimento:", err.message);
      res.status(500).json({ error: "Erro ao atualizar o termo de consentimento." });
    }
  }
);

module.exports = router;
