const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { authenticateToken } = require('./middlewares/authMiddleware');

// Rotas importadas
const appointmentRoutes = require('./routes/appointmentRoutes');
const clientRoutes = require('./routes/clientRoutes');
const technicalSheetRoutes = require('./routes/technicalSheetRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const miscRoutes = require('./routes/miscRoutes');
const proceduresRoutes = require('./routes/proceduresRoutes');
const consentRoutes = require('./routes/consentRoutes');
const cors = require('cors');

const app = express();
const PORT = 10000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Rotas
app.use(authRoutes);
app.use(appointmentRoutes);
app.use(clientRoutes);
app.use(technicalSheetRoutes);
app.use(taskRoutes);
app.use(dashboardRoutes);
app.use(miscRoutes);
app.use(proceduresRoutes);
app.use(consentRoutes);
app.use(authenticateToken);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}...`);
});

// Rota fake de GET para manter a conexão
setInterval(() => {
  axios.get(`https://lashapp.onrender.com/api/get`)
    .then(response => {
      console.log('GET realizado com sucesso');
    })
    .catch(error => {
      console.error('GET feito.');
    });
}, 5 * 60 * 1000);  // 5 minutos em milissegundos