const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const { ensureDbConnection, authenticateToken, connectDB } = require("../middlewares/authMiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// Rota de login
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../app/auth.html"));
});

// Rota para processar o login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Login e senha são obrigatórios");
  }

  try {
    await connectDB(); // Certifica-se de que está conectado antes de tentar fazer o login

    const user = await db.collection("users").findOne({ username, password });

    if (!user) {
      return res.status(401).send("Credenciais inválidas");
    }

    console.log("Autenticação bem-sucedida");

    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    console.error("Erro na autenticação:", err);
    res.status(500).send("Erro no servidor");
  }
});

// Rota para logout
router.get(
  "/logout",
  authenticateToken,
  ensureDbConnection,
  async (req, res) => {
    req.session.destroy(async (err) => {
      if (err) {
        return res.status(500).send("Erro ao sair");
      }

      // Desconectar do MongoDB
      try {
        await client.close();
        console.log("Desconectado do MongoDB");
        isConnected = false; // Atualiza o estado de conexão
        res.redirect("/login"); // Redireciona para a página de login após o logout
      } catch (error) {
        console.error("Erro ao desconectar do MongoDB:", error);
        res.status(500).send("Erro ao desconectar do servidor");
      }
    });
  }
);

module.exports = router;
