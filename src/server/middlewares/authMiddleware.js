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
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}


function normalizeText(text) {
  return diacritics.remove(text.toLowerCase());
}

module.exports = { authenticateToken, ensureDbConnection, normalizeText, connectDB, client };
