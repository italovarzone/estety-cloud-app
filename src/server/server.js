const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// URI do MongoDB
const uri = process.env.MONGODB_URI;

// Criação do cliente MongoDB com as opções especificadas
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db; // Variável para armazenar a referência do banco de dados

// Função para conectar ao MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log('Conectado ao MongoDB Atlas');
    db = client.db('lashdb'); // Conecte-se ao banco de dados específico
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err);
  }
}

// Função middleware para garantir que o banco de dados esteja conectado
function ensureDbConnection(req, res, next) {
  if (!db) {
    console.error('Erro: Banco de dados não conectado.');
    return res.status(500).json({ error: 'Banco de dados não conectado.' });
  }
  next();
}

// Conectar ao MongoDB
connectDB().catch(console.error);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../app')));

// Rotas para arquivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'index.html'));
});

app.get('/pages/clientes/listagem.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'pages', 'clientes', 'listagem.html'));
});

app.get('/pages/clientes/ficha_tecnica/ficha_tecnica.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'pages', 'clientes', 'ficha_tecnica', 'ficha_tecnica.html'));
});

app.get('/pages/clientes/cadastro.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'pages', 'clientes', 'cadastro.html'));
});

app.get('/pages/agendamentos/listagem.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'pages', 'agendamentos', 'listagem.html'));
});

app.get('/pages/dashboard/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'pages', 'dashboard', 'dashboard.html'));
});

// Rotas da API

// Rota para adicionar cliente
app.post('/api/clients', ensureDbConnection, async (req, res) => {
  const { name, birthdate, phone } = req.body;
  if (!name || !birthdate || !phone) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const result = await db.collection('clients').insertOne({ name, birthdate, phone });
    res.json({ id: result.insertedId, name, birthdate, phone }); // Retorna o cliente adicionado
  } catch (err) {
    console.error('Erro ao adicionar cliente:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rota para recuperar a ficha técnica de um cliente
app.get('/api/technical-sheets/:clientId', ensureDbConnection, async (req, res) => {
  try {
    const technicalSheet = await db.collection('technical_sheets')
      .find({ clientId: new ObjectId(req.params.clientId) })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    if (technicalSheet.length === 0) {
      return res.status(404).json({ error: 'Ficha técnica não encontrada' });
    }
    res.json(technicalSheet[0]);
  } catch (err) {
    console.error('Erro ao recuperar ficha técnica:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rota para listar todos os clientes
app.get('/api/clients', ensureDbConnection, async (req, res) => {
  const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
  try {
    const query = searchQuery ? { name: { $regex: searchQuery, $options: 'i' } } : {};
    const clients = await db.collection('clients').find(query).toArray();
    res.json({ clients });
  } catch (err) {
    console.error('Erro ao listar clientes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rota para adicionar agendamento
app.post('/api/appointments', ensureDbConnection, async (req, res) => {
  const { clientId, procedure, date, time } = req.body;

  if (!clientId || !procedure || !date || !time) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const existingAppointment = await db.collection('appointments').findOne({ date, time });
    if (existingAppointment) {
      return res.status(409).json({ error: 'Já existe um agendamento para este horário.' });
    }

    const result = await db.collection('appointments').insertOne({
      clientId: new ObjectId(clientId),
      procedure,
      date,
      time,
      concluida: false,
    });
    res.status(201).json({
      id: result.insertedId,
      clientId,
      procedure,
      date,
      time,
      concluida: false,
    });
  } catch (err) {
    console.error('Erro ao adicionar agendamento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rota para listar todos os agendamentos
app.get('/api/appointments', ensureDbConnection, async (req, res) => {
  const { status } = req.query;
  try {
    const query = status === 'concluidos'
      ? { concluida: true }
      : { $or: [{ concluida: { $exists: false } }, { concluida: false }] };

    const appointments = await db.collection('appointments').aggregate([
      { $match: query },
      { $lookup: {
        from: 'clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client'
      }},
      { $unwind: '$client' },
      { $project: { 
        id: '$_id', // Adiciona o campo de ID do agendamento
        procedure: 1, 
        date: 1, 
        time: 1, 
        'client.name': 1 
      }}
    ]).toArray();

    res.json({ appointments });
  } catch (err) {
    console.error('Erro ao listar agendamentos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Outras rotas para concluir, editar, deletar agendamentos e clientes
// (Assegure-se de que todas as rotas usem ensureDbConnection)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
