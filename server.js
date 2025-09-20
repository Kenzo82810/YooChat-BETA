const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

function load(file){
  if(!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file)); } catch(e){ return []; }
}
function save(file, data){ fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// Init data files if missing
if(!fs.existsSync(USERS_FILE)) save(USERS_FILE, []);
if(!fs.existsSync(MESSAGES_FILE)) save(MESSAGES_FILE, []);

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ success:false, message:'Champs manquants' });
  const users = load(USERS_FILE);
  if(users.find(u => u.username === username)) return res.status(400).json({ success:false, message:'Utilisateur existant' });
  users.push({ username, password });
  save(USERS_FILE, users);
  return res.json({ success:true });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = load(USERS_FILE);
  const user = users.find(u => u.username === username && u.password === password);
  if(!user) return res.status(400).json({ success:false, message:'Identifiants invalides' });
  return res.json({ success:true, username });
});

// Save a message (private or public)
// Body: { from, to, text }
app.post('/api/message', (req, res) => {
  const { from, to, text } = req.body;
  if(!from || !text) return res.status(400).json({ success:false, message:'Champ manquant' });
  const messages = load(MESSAGES_FILE);
  const msg = {
    id: Date.now() + Math.floor(Math.random()*1000),
    from, 
    to: to || 'ALL',
    text,
    time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    ts: Date.now()
  };
  messages.push(msg);
  save(MESSAGES_FILE, messages);
  return res.json({ success:true, message: msg });
});

// Get messages for a user (all messages where user is sender or recipient or public)
// GET /api/messages/:user
app.get('/api/messages/:user', (req, res) => {
  const user = req.params.user;
  const messages = load(MESSAGES_FILE);
  const userMsgs = messages.filter(m => m.to === 'ALL' || m.from === user || m.to === user);
  res.json(userMsgs);
});

// Get list of users
app.get('/api/users', (req, res) => {
  const users = load(USERS_FILE).map(u=>u.username);
  res.json(users);
});

app.listen(PORT, () => console.log(`YooChat backend running on http://localhost:${PORT}`));

