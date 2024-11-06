const express = require("express");
const { ObjectId } = require("mongodb");
const { ensureDbConnection, authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Listar todos os procedimentos
router.get("/api/procedures", authenticateToken, ensureDbConnection, async (req, res) => {
    try {
        const db = req.db; // Use 'req.db' para acessar o banco de dados
        const procedures = await db.collection("procedures").find({}).toArray();
        res.json({ procedures });
    } catch (err) {
        console.error("Erro ao listar procedimentos:", err.message);
        res.status(500).json({ error: "Erro ao listar procedimentos." });
    }
});

// Adicionar um novo procedimento
router.post("/api/procedures", authenticateToken, ensureDbConnection, async (req, res) => {
    const { name, description, price } = req.body;
    if (!name) {
        return res.status(400).json({ error: "O nome do procedimento é obrigatório." });
    }
    if (price === undefined || typeof price !== "number" || price <= 0) {
        return res.status(400).json({ error: "O preço deve ser um valor numérico positivo." });
    }

    try {
        const db = req.db; // Use 'req.db' para acessar o banco de dados
        const result = await db.collection("procedures").insertOne({ name, description, price });
        res.status(201).json({ id: result.insertedId, name, description, price });
    } catch (err) {
        console.error("Erro ao adicionar procedimento:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Atualizar um procedimento existente
router.put("/api/procedures/:id", authenticateToken, ensureDbConnection, async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;

    if (!name) {
        return res.status(400).json({ error: "O nome do procedimento é obrigatório." });
    }
    if (price === undefined || typeof price !== "number" || price <= 0) {
        return res.status(400).json({ error: "O preço deve ser um valor numérico positivo." });
    }

    try {
        const db = req.db; // Use 'req.db' para acessar o banco de dados
        const result = await db.collection("procedures").updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, description, price } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Procedimento não encontrado." });
        }

        res.json({ success: true, message: "Procedimento atualizado com sucesso." });
    } catch (err) {
        console.error("Erro ao atualizar procedimento:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Excluir um procedimento
router.delete("/api/procedures/:id", authenticateToken, ensureDbConnection, async (req, res) => {
    const { id } = req.params;

    try {
        const db = req.db; // Use 'req.db' para acessar o banco de dados
        const result = await db.collection("procedures").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Procedimento não encontrado." });
        }

        res.json({ success: true, message: "Procedimento excluído com sucesso." });
    } catch (err) {
        console.error("Erro ao excluir procedimento:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
