const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = 'bigfoot-secret-key';
const app = express();
const db = new sqlite3.Database('./users.db');

app.use(cors());
app.use(bodyParser.json());

// Cria a tabela de usuários se não existir
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

// Rota de registro
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], err => {
    if (err) return res.status(400).json({ error: 'Usuário já existe' });
    res.json({ success: true });
  });
});

// Rota de login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (!row) return res.status(401).json({ error: 'Usuário não encontrado' });
    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(403).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
    res.json({ token });
  });
});

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Sem token' });
  const token = auth.split(' ')[1];
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
}

// Rota protegida
app.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

// Inicia o servidor
app.listen(3000, () => console.log('API rodando em http://localhost:3000'));
