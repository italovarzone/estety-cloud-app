const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const diacritics = require('diacritics');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let isConnected = false;
let db;

async function connectDB() {
  if (!isConnected) {
    try {
      await client.connect();
      console.log('Conectado ao MongoDB Atlas');
      db = client.db(process.env.NAME_DB);
      isConnected = true;
    } catch (err) {
      console.error('Erro ao conectar ao MongoDB:', err);
      isConnected = false;
    }
  }
}

async function ensureDbConnection(req, res, next) {
  try {
    if (!isConnected || !client.topology || !client.topology.isConnected()) {
      await connectDB();
    }
    req.db = db;
    next();
  } catch (err) {
    console.error('Erro ao garantir a conexão com o MongoDB:', err);
    res.status(500).json({ error: 'Erro ao garantir a conexão com o banco de dados.' });
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Se o token não estiver presente, redireciona para o login
    return res.redirect('/login');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erro ao verificar o token:', err);
      // Se o token for inválido, redireciona para o login
      return res.redirect('/login');
    }
    req.user = user; // Define o usuário autenticado no request
    next();
  });
}

function normalizeText(text) {
  return diacritics.remove(text.toLowerCase());
}

module.exports = { authenticateToken, ensureDbConnection, normalizeText, connectDB, client };
