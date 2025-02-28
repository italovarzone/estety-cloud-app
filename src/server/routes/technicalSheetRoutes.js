const express = require("express");
const { ObjectId } = require("mongodb");
const {
  ensureDbConnection,
  authenticateToken,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Rota para recuperar a ficha técnica de um cliente
router.get(
  "/api/technical-sheets/:clientId",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const technicalSheet = await db
        .collection("technical_sheets")
        .find({ clientId: new ObjectId(req.params.clientId) })
        .sort({ _id: -1 })
        .limit(1)
        .toArray();

      if (technicalSheet.length === 0) {
        return res.status(404).json({ error: "Ficha técnica não encontrada" });
      }
      res.json(technicalSheet[0]); // Retorna toda a ficha técnica, incluindo o campo 'consentAccepted'
    } catch (err) {
      console.error("Erro ao recuperar ficha técnica:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para adicionar ficha técnica
router.post(
  "/api/technical-sheets",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const {
      clientId,
      datetime,
      rimel,
      gestante,
      procedimento_olhos,
      alergia,
      especificar_alergia,
      tireoide,
      problema_ocular,
      especificar_ocular,
      oncologico,
      dorme_lado,
      dorme_lado_posicao,
      problema_informar,
      procedimento,
      mapping,
      estilo,
      modelo_fios,
      espessura,
      curvatura,
      adesivo,
      observacao,
      consentAccepted,  // Novo campo adicionado
    } = req.body;

    // Verificação dos campos obrigatórios
    if (!clientId || !datetime || consentAccepted === undefined) {
      return res.status(400).json({ error: "Preencha todos os campos necessários." });
    }

    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const result = await db.collection("technical_sheets").insertOne({
        clientId: new ObjectId(clientId),
        datetime,
        rimel,
        gestante,
        procedimento_olhos,
        alergia,
        especificar_alergia,
        tireoide,
        problema_ocular,
        especificar_ocular,
        oncologico,
        dorme_lado,
        dorme_lado_posicao,
        problema_informar,
        procedimento,
        mapping,
        estilo,
        modelo_fios,
        espessura,
        curvatura,
        adesivo,
        observacao,
        consentAccepted,  // Salva o consentimento
      });
      res.status(201).json({
        id: result.insertedId,
        clientId,
        datetime,
        rimel,
        gestante,
        procedimento_olhos,
        alergia,
        especificar_alergia,
        tireoide,
        problema_ocular,
        especificar_ocular,
        oncologico,
        dorme_lado,
        dorme_lado_posicao,
        problema_informar,
        procedimento,
        mapping,
        estilo,
        modelo_fios,
        espessura,
        curvatura,
        adesivo,
        observacao,
        consentAccepted,  // Inclui no retorno da resposta
      });
    } catch (err) {
      console.error("Erro ao adicionar ficha técnica:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// Rota para editar ficha técnica
router.put(
  "/api/technical-sheets/:clientId",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    const clientId = req.params.clientId;
    const {
      datetime,
      rimel,
      gestante,
      procedimento_olhos,
      alergia,
      especificar_alergia,
      tireoide,
      problema_ocular,
      especificar_ocular,
      oncologico,
      dorme_lado,
      dorme_lado_posicao,
      problema_informar,
      procedimento,
      mapping,
      estilo,
      modelo_fios,
      espessura,
      curvatura,
      adesivo,
      observacao,
      consentAccepted,  // Novo campo adicionado
    } = req.body;

    // Verificação dos campos obrigatórios
    if (!datetime || !rimel || !gestante || consentAccepted === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    try {
      const db = req.db; // Use 'req.db' para acessar o banco de dados
      const result = await db.collection("technical_sheets").updateOne(
        { clientId: new ObjectId(clientId) },
        {
          $set: {
            datetime,
            rimel,
            gestante,
            procedimento_olhos,
            alergia,
            especificar_alergia,
            tireoide,
            problema_ocular,
            especificar_ocular,
            oncologico,
            dorme_lado,
            dorme_lado_posicao,
            problema_informar,
            procedimento,
            mapping,
            estilo,
            modelo_fios,
            espessura,
            curvatura,
            adesivo,
            observacao,
            consentAccepted,  // Atualiza o consentimento
          },
        }
      );
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "Ficha técnica não encontrada." });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao atualizar ficha técnica:", err.message);
      res.status(500).json({ error: "Erro ao atualizar ficha técnica." });
    }
  }
);

module.exports = router;
