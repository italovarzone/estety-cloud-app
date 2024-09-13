const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let isConnected = false; // Estado de conexão com o banco de dados

// Conecta ao MongoDB
async function connectDB() {
  if (!isConnected) { // Conecta apenas se não estiver conectado
    try {
      await client.connect();
      console.log('Conectado ao MongoDB Atlas');
      db = client.db(process.env.NAME_DB);
      isConnected = true;
    } catch (err) {
      console.error('Erro ao conectar ao MongoDB:', err);
    }
  }
}

// Middleware para verificar o token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token de autenticação é necessário' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erro ao verificar o token:', err);
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Middleware para garantir a conexão com o banco de dados
async function ensureDbConnection(req, res, next) {
  try {
    await connectDB(); // Garante que o MongoDB esteja conectado antes de qualquer operação
    next();
  } catch (err) {
    console.error('Erro ao garantir a conexão com o MongoDB:', err);
    res.status(500).json({ error: 'Erro ao garantir a conexão com o banco de dados.' });
  }
}

// Função para remover acentuação e transformar em minúsculas
function normalizeText(text) {
    return diacritics.remove(text.toLowerCase());
  }

module.exports = { authenticateToken, ensureDbConnection, normalizeText, connectDB };
