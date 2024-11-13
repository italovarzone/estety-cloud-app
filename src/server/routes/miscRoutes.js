const express = require('express');
const axios = require('axios');

const router = express.Router();

// Endpoint para verificar o status de um outro endpoint
router.get('/api/check-endpoint', async (req, res) => {
    try {
        const response = await axios.get('https://mailmicroservice.onrender.com/api/status');
        
        if (response.status === 200) {
          res.status(200).json({ status: 'online' });
        } else {
          res.status(response.status).json({ status: 'offline' });
        }
      } catch (error) {
        console.error('Erro ao verificar o endpoint:', error.message);
    
        if (error.response) {
          res.status(error.response.status).json({ status: 'offline', message: error.response.statusText });
        } else {
          res.status(500).json({ status: 'offline', message: 'Erro ao acessar o serviço externo.' });
        }
      }
});

// Outra rota fake de GET para manter a conexão
router.get('/api/get', async (req, res) => {
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';
    try {
      const query = searchQuery ? { name: { $regex: searchQuery, $options: 'i' } } : {};
      const clients = await db.collection('clients').find(query).toArray();
      res.json({ clients });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

module.exports = router;
