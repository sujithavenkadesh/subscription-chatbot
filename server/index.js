require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bot = require('./botLogic');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Subscription chatbot API is running'));

app.get('/api/customers/lookup/:phone', async (req, res) => {
  try {
    const data = await bot.lookupCustomer(req.params.phone);
    if (!data) return res.status(404).json({ message: 'Customer not found' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, phone, email, address } = req.body;
  if (!name || !/^\d{10}$/.test(phone || '')) {
    return res.status(400).json({ message: 'Name and a 10-digit phone number are required' });
  }
  try {
    res.status(201).json(await bot.registerCustomer({ name, phone, email, address }));
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Phone number already registered' });
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    res.json(await bot.listProducts());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  const { customerId, planId } = req.body;
  try {
    const sub = await bot.subscribe(customerId, planId);
    if (!sub) return res.status(404).json({ message: 'Plan not found' });
    res.status(201).json(sub);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));