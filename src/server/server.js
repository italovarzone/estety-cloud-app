const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let isConnected = false;

// Conecta ao MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log('Conectado ao MongoDB Atlas');
    db = client.db('lashdb');
    isConnected = true;
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err);
  }
}

// Middleware para garantir a conexão com o banco de dados
function ensureDbConnection(req, res, next) {
  if (!db) {
    console.error('Erro: Banco de dados não conectado.');
    return res.status(500).json({ error: 'Banco de dados não conectado.' });
  }
  next();
}

// Middleware para verificar o token JWT
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Token de autenticação é necessário' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Configuração da sessão
app.use(session({
  secret: 'secretkey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../app')));

// Rota de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../app/auth.html'));
});

// Rota para processar o login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Login e senha são obrigatórios');
  }

  try {
    if (!isConnected) await connectDB();

    const user = await db.collection('users').findOne({ username, password });

    if (!user) {
      return res.status(401).send('Credenciais inválidas');
    }

    app.use(express.static(path.join(__dirname, '../app')));
    console.log('Autenticação bem-sucedida');
    
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });
  } catch (err) {
    console.error('Erro na autenticação:', err);
    res.status(500).send('Erro no servidor');
  }
});

// Rota principal protegida (home)
app.get('/', authenticateToken, ensureDbConnection, (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'index.html'));
});

// Rotas para arquivos estáticos
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

app.get('/pages/calendario/calendario.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'pages', 'calendario', 'calendario.html'));
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
app.get('/api/technical-sheets/:clientId', authenticateToken, ensureDbConnection, async (req, res) => {
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

// Rota para adicionar ficha técnica
app.post('/api/technical-sheets', ensureDbConnection, async (req, res) => {
    const {
      clientId, datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
      tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao, problema_informar,
      procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo, observacao
    } = req.body;
  
    // Verificação dos campos obrigatórios
    if (!clientId || !datetime || !rimel || !gestante) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
  
    try {
      const result = await db.collection('technical_sheets').insertOne({
        clientId: new ObjectId(clientId), datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
        tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao, problema_informar,
        procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo, observacao
      });
      res.status(201).json({
        id: result.insertedId,
        clientId, datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
        tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao, problema_informar,
        procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo, observacao
      });
    } catch (err) {
      console.error('Erro ao adicionar ficha técnica:', err.message);
      res.status(500).json({ error: err.message });
    }
});

// Rota para editar ficha técnica
app.put('/api/technical-sheets/:clientId', authenticateToken, ensureDbConnection, async (req, res) => {
    const clientId = req.params.clientId;
    const {
      datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
      tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado,
      dorme_lado_posicao, problema_informar, procedimento, mapping, estilo,
      modelo_fios, espessura, curvatura, adesivo, observacao
    } = req.body;
  
    // Verificação dos campos obrigatórios
    if (!datetime || !rimel || !gestante) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
  
    try {
      const result = await db.collection('technical_sheets').updateOne(
        { clientId: new ObjectId(clientId) },
        {
          $set: {
            datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
            tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao,
            problema_informar, procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo, observacao
          }
        }
      );
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: 'Ficha técnica não encontrada.' });
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Erro ao atualizar ficha técnica:', err.message);
      res.status(500).json({ error: 'Erro ao atualizar ficha técnica.' });
    }
});

// Rota para deletar um cliente
app.delete('/api/clients/:id', authenticateToken, ensureDbConnection, async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await db.collection('clients').deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }
      
      res.json({ success: true, message: 'Cliente deletado com sucesso.' });
    } catch (err) {
      console.error('Erro ao deletar cliente:', err.message);
      res.status(500).json({ error: 'Erro ao deletar cliente.' });
    }
  });

  // Rota para editar cliente
app.put('/api/clients/:id', authenticateToken, ensureDbConnection, async (req, res) => {
    const { id } = req.params;
    const { name, birthdate, phone } = req.body;
  
    if (!name || !birthdate || !phone) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
  
    try {
      const result = await db.collection('clients').updateOne(
        { _id: new ObjectId(id) },
        { $set: { name, birthdate, phone } }
      );
  
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }
  
      res.json({ success: true, message: 'Cliente atualizado com sucesso.' });
    } catch (err) {
      console.error('Erro ao editar cliente:', err.message);
      res.status(500).json({ error: 'Erro ao editar cliente.' });
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
app.post('/api/appointments', authenticateToken, ensureDbConnection, async (req, res) => {
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

// Rota para concluir agendamento
app.put('/api/appointments/:id/conclude', ensureDbConnection, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.collection('appointments').updateOne({ _id: new ObjectId(id) }, { $set: { concluida: true } });
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao concluir agendamento:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rota para o dashboard
app.get('/api/dashboard', ensureDbConnection, async (req, res) => {
    try {
      const totalAppointments = await db.collection('appointments').countDocuments();
      const totalClients = await db.collection('clients').countDocuments();
      res.json({
        totalAppointments,
        totalClients
      });
    } catch (err) {
      console.error('Erro ao carregar o dashboard:', err.message);
      res.status(500).json({ error: 'Erro ao carregar o dashboard.' });
    }
  });
  
  // Rota para listar agendamentos por cliente
  app.get('/api/appointments-by-client', ensureDbConnection, async (req, res) => {
    try {
      const appointmentsByClient = await db.collection('appointments').aggregate([
        { $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client'
        }},
        { $unwind: '$client' },
        { $group: {
          _id: '$client._id',
          client_name: { $first: '$client.name' },
          appointment_count: { $sum: 1 }
        }}
      ]).toArray();
  
      res.json(appointmentsByClient);
    } catch (err) {
      console.error('Erro ao carregar dados dos agendamentos por cliente:', err.message);
      res.status(500).json({ error: 'Erro ao carregar dados dos agendamentos.' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}...`);
  });
  
  // Rota fake de GET para manter a conexão
  setInterval(() => {
    axios.get(`http://localhost:${PORT}/api/clients`)
      .then(response => {
        console.log('GET realizado com sucesso');
      })
      .catch(error => {
        console.error('Erro ao realizar o GET fake:', error.message);
      });
  }, 1 * 60 * 1000);  // 1 minuto em milissegundos