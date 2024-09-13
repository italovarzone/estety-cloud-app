const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const { client, connectDB, isConnected } = require("../middlewares/authMiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

async function ensureClientConnection() {
  if (!isConnected) {
    await connectDB();
  }
}

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../app/auth.html"));
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Login e senha são obrigatórios");
  }

  try {
    await ensureClientConnection();

    const db = client.db(process.env.NAME_DB);
    const user = await db.collection("users").findOne({ username, password });

    if (!user) {
      console.log("Usuário não encontrado ou credenciais incorretas.");
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

router.get("/logout", async (req, res) => {
  req.session.destroy(async (err) => {
    if (err) {
      return res.status(500).send("Erro ao sair");
    }

    console.log("Sessão destruída");
    res.redirect("/login");
  });
});

module.exports = router;
