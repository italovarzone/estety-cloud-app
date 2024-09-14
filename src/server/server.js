const express = require('express');
const path = require('path');
const session = require('express-session');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { ensureDbConnection, authenticateToken } = require('./middlewares/authMiddleware');

// Rotas importadas
const appointmentRoutes = require('./routes/appointmentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const technicalSheetRoutes = require('./routes/technicalSheetRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const miscRoutes = require('./routes/miscRoutes');
const proceduresRoutes = require('./routes/proceduresRoutes');

const app = express();
const PORT = 3000;

app.use(session({ secret: 'secretkey', resave: false, saveUninitialized: true, cookie: { secure: false } }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../app')));

// Rotas
app.use(authRoutes);
app.use(appointmentRoutes);
app.use(clientRoutes);
app.use(technicalSheetRoutes);
app.use(taskRoutes);
app.use(dashboardRoutes);
app.use(miscRoutes);
app.use(proceduresRoutes);

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

// Rota para a página de cadastro de procedimentos
app.get('/pages/procedimentos/cadastro.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../app', 'pages', 'procedimentos', 'cadastro.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}...`);
});

// Rota fake de GET para manter a conexão
setInterval(() => {
  axios.get(`https://lash-app.onrender.com/api/get`)
    .then(response => {
      console.log('GET realizado com sucesso');
    })
    .catch(error => {
      console.error('GET feito.');
    });
}, 5 * 60 * 1000);  // 5 minutos em milissegundos