import express from 'express';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();
const PORT = 3000;

// Configurar body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar ao banco de dados SQLite
const dbPath = path.resolve(__dirname, 'database/dblash.db');
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
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER,
            procedure TEXT,
            date TEXT,
            time TEXT,
            FOREIGN KEY(clientId) REFERENCES clients(id)
        );`);
    }
});

// Servir arquivos estáticos
app.use(express.static(path.resolve(__dirname, 'public')));

// Rotas para gerenciar clientes
app.post('/api/clients', (req, res) => {
    const { name, email, phone } = req.body;
    db.run(`INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)`, [name, email, phone], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email, phone });
    });
});

app.get('/api/clients', (req, res) => {
    db.all(`SELECT * FROM clients`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ clients: rows });
    });
});

app.delete('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM clients WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deletedID: id });
    });
});


// Rotas para gerenciar agendamentos
app.post('/api/appointments', (req, res) => {
    const { clientId, procedure, date, time } = req.body;
    db.run(`INSERT INTO appointments (clientId, procedure, date, time) VALUES (?, ?, ?, ?)`, [clientId, procedure, date, time], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, clientId, procedure, date, time });
    });
});

app.get('/api/appointments', (req, res) => {
    db.all(`SELECT appointments.id, clients.name AS client, appointments.procedure, appointments.date, appointments.time 
            FROM appointments 
            INNER JOIN clients ON appointments.clientId = clients.id`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ appointments: rows });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
