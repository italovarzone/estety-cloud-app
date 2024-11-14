const express = require("express");
const { ObjectId } = require("mongodb");
const { ensureDbConnection, authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Listar todos os procedimentos
router.get("/api/procedures", ensureDbConnection, async (req, res) => {
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
    const { name, description, price, duration } = req.body;
    if (!name) {
        return res.status(400).json({ error: "O nome do procedimento é obrigatório." });
    }
    if (price === undefined || typeof price !== "number" || price <= 0) {
        return res.status(400).json({ error: "O preço deve ser um valor numérico positivo." });
    }
    if (duration !== undefined && (typeof duration !== "number" || duration <= 0)) {
        return res.status(400).json({ error: "A duração deve ser um valor numérico positivo." });
    }

    try {
        const db = req.db;
        const result = await db.collection("procedures").insertOne({ name, description, price, duration });
        res.status(201).json({ id: result.insertedId, name, description, price, duration });
    } catch (err) {
        console.error("Erro ao adicionar procedimento:", err.message);
        res.status(500).json({ error: err.message });
    }
});


// Atualizar um procedimento existente
router.put("/api/procedures/:id", authenticateToken, ensureDbConnection, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, duration } = req.body;

    if (!name) {
        return res.status(400).json({ error: "O nome do procedimento é obrigatório." });
    }
    if (price === undefined || typeof price !== "number" || price <= 0) {
        return res.status(400).json({ error: "O preço deve ser um valor numérico positivo." });
    }
    if (duration !== undefined && (typeof duration !== "number" || duration <= 0)) {
        return res.status(400).json({ error: "A duração deve ser um valor numérico positivo." });
    }

    try {
        const db = req.db;
        const result = await db.collection("procedures").updateOne(
            { _id: new ObjectId(id) },
            { $set: { name, description, price, duration } }
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

// Endpoint para calcular a lucratividade mensal e anual
router.get("/api/procedures/revenue", authenticateToken, ensureDbConnection, async (req, res) => {
    try {
        const db = req.db;

        // Obtenha todos os procedimentos para referência
        const procedures = await db.collection("procedures").find({}).toArray();
        const procedureMap = procedures.reduce((map, procedure) => {
            map[procedure.name] = procedure.price; // Mapeia o nome do procedimento para o preço
            return map;
        }, {});

        // Busca todos os agendamentos e calcula a receita mensal e anual
        const appointments = await db.collection("appointments").find({}).toArray();
        
        let monthlyRevenue = {};
        let annualRevenue = 0;
        const currentYear = new Date().getFullYear();

        appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date);
            const month = appointmentDate.getMonth() + 1; // Mês (1 a 12)
            const year = appointmentDate.getFullYear();

            // Obtenha o preço do procedimento pelo nome
            const procedurePrice = procedureMap[appointment.procedure] || 0;

            // Soma para a receita mensal
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
            if (!monthlyRevenue[monthKey]) {
                monthlyRevenue[monthKey] = 0;
            }
            monthlyRevenue[monthKey] += procedurePrice;

            // Soma para a receita anual apenas se for do ano corrente
            if (year === currentYear) {
                annualRevenue += procedurePrice;
            }
        });

        res.json({ monthlyRevenue, annualRevenue });
    } catch (err) {
        console.error("Erro ao calcular lucratividade:", err.message);
        res.status(500).json({ error: "Erro ao calcular lucratividade." });
    }
});


module.exports = router;
