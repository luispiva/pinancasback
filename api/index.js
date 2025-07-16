import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import path from 'path';
import { fileURLToPath } from 'url';

// Pra resolver __dirname no ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/dist')));


const app = express();
app.use(cors());
app.use(bodyParser.json());

const USERS_FILE = './api/users.json';
const SECRET = "segredo_supersecreto_do_jwt";

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

  const users = readUsers();
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Usuário já existe' });

  const hash = await bcrypt.hash(password, 10);
  users.push({ username, password: hash, despesas: [] });
  saveUsers(users);

  const token = jwt.sign({ username }, SECRET, { expiresIn: '1d' });
  res.json({ token });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: 'Usuário ou senha inválidos' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Usuário ou senha inválidos' });

  const token = jwt.sign({ username }, SECRET, { expiresIn: '1d' });
  res.json({ token });
});

app.get('/api/despesas', authenticate, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.username === req.user.username);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user.despesas || []);
});

app.post('/api/despesas', authenticate, (req, res) => {
  const { descricao, valor, data, parcelaTotal } = req.body;
  if (!descricao || !valor || !data) return res.status(400).json({ error: 'Campos obrigatórios' });

  const users = readUsers();
  const userIndex = users.findIndex(u => u.username === req.user.username);
  if (userIndex === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

  const despesas = users[userIndex].despesas || [];
  const total = parcelaTotal && parcelaTotal > 1 ? parcelaTotal : 1;

  for (let i = 0; i < total; i++) {
    let dt = new Date(data);
    dt.setMonth(dt.getMonth() + i);
    despesas.push({
      descricao: `${descricao} ${total > 1 ? `(Parcela ${i + 1}/${total})` : ''}`,
      valor,
      data: dt.toISOString().substring(0, 10)
    });
  }

  users[userIndex].despesas = despesas;
  saveUsers(users);
  res.json({ message: 'Despesa adicionada com sucesso' });
});

export default app;
