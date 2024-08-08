const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Configurar body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar ao banco de dados SQLite
const dbPath = path.resolve(__dirname, '../database/clientdb.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT
        );`);
    }
});

// Servir arquivos estáticos
app.use(express.static(path.resolve(__dirname, '../public')));

// Rota para adicionar cliente
app.post('/api/clients', (req, res) => {
    const { name, email, phone } = req.body;
    db.run(`INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)`, [name, email, phone], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email, phone });
    });
});

// Rota para listar clientes
app.get('/api/clients', (req, res) => {
    db.all(`SELECT * FROM clients`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ clients: rows });
    });
});

// Rota para remover cliente
app.delete('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM clients WHERE id = ?`, id, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deletedID: id });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
