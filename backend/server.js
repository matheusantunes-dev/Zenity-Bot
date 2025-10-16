import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fetch } from 'undici';

const app = express();

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const JWT_SECRET = process.env.JWT_SECRET || 'troque-este-segredo';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const WABA_TOKEN = process.env.WABA_TOKEN || '';
const WABA_PHONE_ID = process.env.WABA_PHONE_ID || '';
const WABA_API_VER = process.env.WABA_API_VER || 'v21.0';

fs.mkdirSync(DATA_DIR, { recursive: true });

const USERS = path.join(DATA_DIR, 'users.json');
const SETTINGS = path.join(DATA_DIR, 'settings.json');
const GROUPS = path.join(DATA_DIR, 'groups.json');

function readJSON(p, def){ try{ return JSON.parse(fs.readFileSync(p, 'utf8')); }catch{ return def; } }
function writeJSON(p, v){ fs.writeFileSync(p, JSON.stringify(v, null, 2)); }

if(!fs.existsSync(USERS)) writeJSON(USERS, []);
if(!fs.existsSync(SETTINGS)) writeJSON(SETTINGS, { message:'Olá, mundo!', schedule:'09:00, 14:00', powerDisabled:false });
if(!fs.existsSync(GROUPS)) writeJSON(GROUPS, []);

app.use(express.json({ limit:'1mb' }));
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));

function auth(req, res, next){
  try{
    const m = (req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);
    if(!m) return res.status(401).json({ error:'token' });
    req.user = jwt.verify(m[1], JWT_SECRET).u;
    next();
  }catch{ return res.status(401).json({ error:'token' }); }
}

app.post('/auth/signup', (req,res)=>{
  const { username, password } = req.body||{};
  if(!username || !password) return res.status(400).json({ error:'campos' });
  const list = readJSON(USERS, []);
  if(list.length > 0) return res.status(409).json({ error:'existe' });
  const hash = bcrypt.hashSync(password, 10);
  list.push({ username, hash, createdAt: new Date().toISOString() });
  writeJSON(USERS, list);
  const token = jwt.sign({ u: username }, JWT_SECRET, { expiresIn:'7d' });
  res.json({ ok:true, token, username });
});

app.post('/auth/login', (req,res)=>{
  const { username, password } = req.body||{};
  if(!username || !password) return res.status(400).json({ error:'campos' });
  const list = readJSON(USERS, []);
  const u = list.find(x=> x.username===username);
  if(!u) return res.status(404).json({ error:'naoexist' });
  if(!bcrypt.compareSync(password, u.hash)) return res.status(401).json({ error:'senha' });
  const token = jwt.sign({ u: username }, JWT_SECRET, { expiresIn:'7d' });
  res.json({ ok:true, token, username });
});

app.get('/api/power', auth, (req,res)=>{
  const s = readJSON(SETTINGS, {});
  res.json({ disabled: !!s.powerDisabled });
});
app.post('/api/power', auth, (req,res)=>{
  const s = readJSON(SETTINGS, {});
  const on = !!(req.body && req.body.on);
  s.powerDisabled = !on;
  writeJSON(SETTINGS, s);
  res.json({ ok:true, disabled: s.powerDisabled });
});

app.get('/api/message', auth, (req,res)=>{
  const s = readJSON(SETTINGS, {});
  res.type('text/plain').send(s.message || '');
});
app.post('/api/message', auth, (req,res)=>{
  const s = readJSON(SETTINGS, {});
  s.message = String((req.body && req.body.text) || '');
  writeJSON(SETTINGS, s);
  res.json({ ok:true });
});

app.get('/api/schedule', auth, (req,res)=>{
  const s = readJSON(SETTINGS, {});
  res.type('text/plain').send(s.schedule || '');
});
app.post('/api/schedule', auth, (req,res)=>{
  const s = readJSON(SETTINGS, {});
  s.schedule = String((req.body && req.body.text) || '');
  writeJSON(SETTINGS, s);
  res.json({ ok:true });
});

app.get('/api/groups', auth, (req,res)=>{
  const g = readJSON(GROUPS, []);
  res.json(g);
});
app.post('/api/groups', auth, (req,res)=>{
  const arr = Array.isArray(req.body) ? req.body.map(x=> String(x)) : [];
  writeJSON(GROUPS, arr);
  res.json({ ok:true });
});

app.post('/api/send', auth, async (req,res)=>{
  try{
    const { to, text } = req.body||{};
    if(!to || !text) return res.status(400).json({ error:'campos' });
    if(!WABA_TOKEN || !WABA_PHONE_ID) return res.status(500).json({ error:'cloudapi_env' });

    const url = `https://graph.facebook.com/${WABA_API_VER}/${WABA_PHONE_ID}/messages`;
    const r = await fetch(url, {
      method:'POST',
      headers:{ 'Authorization': 'Bearer ' + WABA_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: String(to),
        type: 'text',
        text: { body: String(text) }
      })
    });
    const body = await r.json().catch(()=>({}));
    if(!r.ok) return res.status(r.status).json({ error:'cloudapi', details: body });
    res.json({ ok:true, result: body });
  }catch(e){ res.status(500).json({ error:'send' }); }
});

app.get('/health', (req,res)=> res.json({ ok:true, ts: Date.now() }));

app.listen(PORT, ()=> console.log('[API] porta', PORT));
