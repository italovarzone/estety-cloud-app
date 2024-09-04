const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios'); 
const PORT = 3000;
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

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
app.put('/api/technical-sheets/:clientId', ensureDbConnection, async (req, res) => {
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
app.delete('/api/clients/:id', ensureDbConnection, async (req, res) => {
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
app.put('/api/clients/:id', ensureDbConnection, async (req, res) => {
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
  console.log(`Servidor rodando...`);
});

setInterval(() => {
  axios.get(`https://lash-app.onrender.com/api/clients`)
    .then(response => {
      console.log('GET realizado com sucesso');
    })
    .catch(error => {
      console.error('Erro ao realizar o GET fake:', error.message);
    });
}, 1 * 60 * 1000);  // 10 minutos em milissegundos
