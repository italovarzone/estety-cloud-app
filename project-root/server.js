const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const app = express();
const PORT = 3000;

// Configurar o body-parser para interpretar JSON
app.use(express.json());

// Configuração para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Verifica se a pasta do banco de dados existe, caso contrário, cria a pasta
const dbDirectory = path.resolve(__dirname, 'database');
if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory);
}

const dbPath = path.join(dbDirectory, 'dblash.db');

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');

        // Criar tabela de clientes se não existir
        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT
        );`);

        // Criar tabela de agendamentos se não existir
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER,
            procedure TEXT,
            date TEXT,
            time TEXT,
            concluida BOOLEAN,
            FOREIGN KEY(clientId) REFERENCES clients(id)
        );`);

        // Criar tabela de ficha técnica se não existir
        db.run(`CREATE TABLE IF NOT EXISTS technical_sheets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clientId INTEGER,
            datetime TEXT,
            rimel TEXT,
            gestante TEXT,
            procedimento_olhos TEXT,
            alergia TEXT,
            especificar_alergia TEXT,
            tireoide TEXT,
            problema_ocular TEXT,
            especificar_ocular TEXT,
            oncologico TEXT,
            dorme_lado TEXT,
            dorme_lado_posicao TEXT,
            problema_informar TEXT,
            procedimento TEXT,
            mapping TEXT,
            estilo TEXT,
            modelo_fios TEXT,
            espessura TEXT,
            curvatura TEXT,
            adesivo TEXT
        );`);
    }
});

// Rota para a página inicial (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para clientes (clientes.html)
app.get('/clientes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'clientes.html'));
});

// Rota para ficha técnica (ficha_tecnica.html)
app.get('/ficha_tecnica.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ficha_tecnica.html'));
});

// Rota para cadastro (cadastro.html)
app.get('/cadastro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});

// Rota para agendamentos (agendamentos.html)
app.get('/agendamentos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'agendamentos.html'));
});

// Rota para adicionar cliente
app.post('/api/clients', (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    db.run(`INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)`, [name, email, phone], function (err) {
        if (err) {
            console.error('Erro ao adicionar cliente:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email, phone });
    });
});

// Rota para recuperar a ficha técnica de um cliente
app.get('/api/technical-sheets/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    const query = `SELECT * FROM technical_sheets WHERE clientId = ? ORDER BY id DESC LIMIT 1`;

    db.get(query, [clientId], (err, row) => {
        if (err) {
            console.error('Erro ao recuperar ficha técnica:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Ficha técnica não encontrada' });
        }
    });
});

// Rota para listar todos os clientes
app.get('/api/clients', (req, res) => {
    db.all(`SELECT * FROM clients`, [], (err, rows) => {
        if (err) {
            console.error('Erro ao listar clientes:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ clients: rows });
    });
});

// Rota para adicionar agendamento
app.post('/api/appointments', (req, res) => {
    const { clientId, procedure, date, time } = req.body;

    if (!clientId || !procedure || !date || !time) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Verifica se já existe um agendamento para o mesmo dia e horário
    const queryCheck = `SELECT * FROM appointments WHERE date = ? AND time = ?`;
    db.get(queryCheck, [date, time], (err, row) => {
        if (err) {
            console.error('Erro ao verificar agendamento existente:', err.message);
            return res.status(500).json({ error: 'Erro ao verificar agendamento.' });
        }

        if (row) {
            // Já existe um agendamento para o mesmo horário e data
            return res.status(409).json({ error: 'Já existe um agendamento para este horário.' });
        }

        // Se não existir, insere o novo agendamento
        const queryInsert = `INSERT INTO appointments (clientId, procedure, date, time) VALUES (?, ?, ?, ?)`;
        db.run(queryInsert, [clientId, procedure, date, time], function(err) {
            if (err) {
                console.error('Erro ao adicionar agendamento:', err.message);
                return res.status(500).json({ error: 'Erro ao salvar o agendamento.' });
            }
            res.status(201).json({ id: this.lastID, clientId, procedure, date, time });
        });
    });
});



// Rota para listar todos os agendamentos
// app.get('/api/appointments', (req, res) => {
//     const query = `
//         SELECT appointments.id, clients.name AS client, appointments.procedure, appointments.date, appointments.time 
//         FROM appointments 
//         LEFT JOIN clients ON appointments.clientId = clients.id`;

//     db.all(query, [], (err, rows) => {
//         if (err) {
//             console.error('Erro ao listar agendamentos:', err.message);
//             return res.status(500).json({ error: err.message });
//         }
//         res.json({ appointments: rows });
//     });
// });

app.get('/api/appointments', (req, res) => {
    const { date, status } = req.query;
    let query;
    let params = [];

    if (status === 'concluidos') {
        query = `
            SELECT appointments.id, clients.name AS client, appointments.procedure, appointments.date, appointments.time 
            FROM appointments 
            LEFT JOIN clients ON appointments.clientId = clients.id
            WHERE appointments.concluida = 1
        `;
    } else { // Para "não-concluídos" e default
        query = `
            SELECT appointments.id, clients.name AS client, appointments.procedure, appointments.date, appointments.time 
            FROM appointments 
            LEFT JOIN clients ON appointments.clientId = clients.id
            WHERE (appointments.concluida IS NULL OR appointments.concluida <> 1)
        `;
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Erro ao listar agendamentos:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.json({ appointments: rows });
    });
});




app.put('/api/appointments/:id/conclude', (req, res) => {
    const { id } = req.params;
    const query = `UPDATE appointments SET concluida = 1 WHERE id = ?`;

    db.run(query, [id], function (err) {
        if (err) {
            console.error('Erro ao concluir agendamento:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.json({ success: true });
    });
});


// Rota para deletar um agendamento ao concluir
app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM appointments WHERE id = ?`;

    db.run(query, [id], function (err) {
        if (err) {
            console.error('Erro ao concluir e remover agendamento:', err.message);
            return res.status(500).json({ error: err.message });
        }

        res.json({ success: true });
    });
});

// Rota para editar um cliente
app.put('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const query = `UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?`;
    db.run(query, [name, email, phone, id], function(err) {
        if (err) {
            console.error('Erro ao editar cliente:', err.message);
            return res.status(500).json({ error: 'Erro ao editar cliente.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        res.json({ success: true });
    });
});



// Rota para deletar cliente
app.delete('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM clients WHERE id = ?`, id, function (err) {
        if (err) {
            console.error('Erro ao deletar cliente:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ deletedID: id });
    });
});

app.post('/api/technical-sheets', (req, res) => {
    const {
        clientId, datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
        tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao, problema_informar,
        procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo
    } = req.body;

    const query = `INSERT INTO technical_sheets 
    (clientId, datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
    tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao, problema_informar,
    procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [
        clientId, datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
        tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao, problema_informar,
        procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo
    ], function (err) {
        if (err) {
            console.error('Erro ao adicionar ficha técnica:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

app.put('/api/technical-sheets/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    const {
        datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
        tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado,
        dorme_lado_posicao, problema_informar, procedimento, mapping, estilo,
        modelo_fios, espessura, curvatura, adesivo
    } = req.body;

    const query = `
        UPDATE technical_sheets 
        SET datetime = ?, rimel = ?, gestante = ?, procedimento_olhos = ?, alergia = ?, especificar_alergia = ?,
            tireoide = ?, problema_ocular = ?, especificar_ocular = ?, oncologico = ?, dorme_lado = ?, 
            dorme_lado_posicao = ?, problema_informar = ?, procedimento = ?, mapping = ?, estilo = ?, 
            modelo_fios = ?, espessura = ?, curvatura = ?, adesivo = ?
        WHERE clientId = ?
    `;

    db.run(query, [
        datetime, rimel, gestante, procedimento_olhos, alergia, especificar_alergia,
        tireoide, problema_ocular, especificar_ocular, oncologico, dorme_lado, dorme_lado_posicao,
        problema_informar, procedimento, mapping, estilo, modelo_fios, espessura, curvatura, adesivo, clientId
    ], function(err) {
        if (err) {
            console.error('Erro ao atualizar ficha técnica:', err.message);
            return res.status(500).json({ error: 'Erro ao atualizar ficha técnica.' });
        }

        res.json({ success: true });
    });
});




// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
