const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// Initialize SQLite (data.db in project root)
const db = new Database(path.join(__dirname, 'data.db'));
db.prepare(`CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  email TEXT,
  ticket TEXT,
  method TEXT,
  phone TEXT,
  amount REAL,
  status TEXT,
  provider TEXT,
  providerReference TEXT,
  createdAt INTEGER
)`).run();

function insertOrder(o){
  const stmt = db.prepare(`INSERT INTO orders (id,email,ticket,method,phone,amount,status,provider,providerReference,createdAt)
    VALUES (@id,@email,@ticket,@method,@phone,@amount,@status,@provider,@providerReference,@createdAt)`);
  stmt.run(o);
}

function getOrder(id){
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function listOrders(){
  return db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
}

// Bkash helper: get token from provider or simulate if env not set
async function getBkashToken(){
  const base = process.env.BKASH_BASE_URL;
  const appKey = process.env.BKASH_APP_KEY;
  const appSecret = process.env.BKASH_APP_SECRET;
  if(!base || !appKey || !appSecret) return { access_token: 'demo-token', expires_in: 3600 };

  // Example: real implementation will differ per Bkash API version
  const url = base + '/token';
  const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'App-Key':appKey }, body: JSON.stringify({ app_secret: appSecret }) });
  return res.json();
}

// Create a provider payment (for Bkash) - stub that either calls Bkash or simulates
async function createBkashPayment({amount, orderId}){
  const base = process.env.BKASH_BASE_URL;
  if(!base) {
    // simulate
    return { providerReference: 'BKX' + Math.floor(Math.random()*900000+100000), instruction: `Send ${amount}$ to demo Bkash number with reference` };
  }
  // Real integration placeholder: request token, then create payment
  const token = await getBkashToken();
  // Example endpoints and payloads vary — implement per Bkash docs here
  // For now return simulated until real credentials are provided
  return { providerReference: 'BKX' + Math.floor(Math.random()*900000+100000), instruction: `Follow provider flow with token ${token.access_token}` };
}

// API: create payment/order
app.post('/api/pay', async (req, res) => {
  try{
    const { email, ticket, method, phone } = req.body || {};
    if(!method) return res.status(400).json({ error: 'payment method required' });
    const id = uuidv4();
    const amount = ticket === 'vip' ? 199 : 99;
    const createdAt = Date.now();

    const order = { id, email: email||null, ticket: ticket||'general', method, phone: phone||null, amount, status: 'pending', provider: null, providerReference: null, createdAt };

    if(method === 'bkash'){
      const prov = await createBkashPayment({amount, orderId: id});
      order.provider = 'bkash';
      order.providerReference = prov.providerReference;
      order.instruction = prov.instruction;
    }

    insertOrder(order);
    res.json({ success: true, order });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// get order
app.get('/api/order/:id', (req,res)=>{
  const order = getOrder(req.params.id);
  if(!order) return res.status(404).json({ error:'not found' });
  res.json({ order });
});

// Admin: list orders
app.get('/api/admin/orders', (req,res)=>{
  const list = listOrders();
  res.json({ orders: list });
});

// Mark paid
app.post('/api/admin/order/:id/mark-paid', (req,res)=>{
  const id = req.params.id;
  const order = getOrder(id);
  if(!order) return res.status(404).json({ error:'not found' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('paid', id);
  const updated = getOrder(id);
  res.json({ success: true, order: updated });
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
