const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const PRODUCTS_FILE = './products.json';
const TRANSACTIONS_FILE = './transactions.json';

if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(TRANSACTIONS_FILE)) {
  fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([]));
}

const readProducts = () => {
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE));
  } catch (err) {
    console.error('Error reading products.json:', err);
    return [];
  }
};

const writeProducts = (data) => {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing products.json:', err);
  }
};

const readTransactions = () => {
  try {
    return JSON.parse(fs.readFileSync(TRANSACTIONS_FILE));
  } catch (err) {
    console.error('Error reading transactions.json:', err);
    return [];
  }
};

const writeTransactions = (data) => {
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing transactions.json:', err);
  }
};

app.get('/products', (req, res) => {
  res.json(readProducts());
});

app.post('/products', (req, res) => {
  console.log('Received POST /products:', req.body);
  const products = readProducts();
  const newProduct = {
    id: Date.now(),
    name: req.body.name || '',
    description: req.body.description || '',
    category: req.body.category || '',
    price: parseFloat(req.body.price) || 0,
    quantity: parseInt(req.body.quantity) || 0,
    totalStocked: parseInt(req.body.quantity) || 0,
    totalSold: 0
  };
  if (!newProduct.name || !newProduct.category || isNaN(newProduct.price) || isNaN(newProduct.quantity)) {
    return res.status(400).json({ error: 'Missing or invalid fields (name, category, price, and quantity are required)' });
  }
  products.push(newProduct);
  writeProducts(products);

  const transactions = readTransactions();
  transactions.push({
    productId: newProduct.id,
    type: 'add',
    quantity: newProduct.quantity,
    date: new Date().toISOString()
  });
  writeTransactions(transactions);

  res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body, price: parseFloat(req.body.price), quantity: parseInt(req.body.quantity) };
    writeProducts(products);
    res.json(products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/products/:id', (req, res) => {
  let products = readProducts();
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    products = products.filter(p => p.id !== parseInt(req.params.id));
    writeProducts(products);
    const transactions = readTransactions();
    transactions.push({
      productId: product.id,
      type: 'delete',
      quantity: product.quantity,
      date: new Date().toISOString()
    });
    writeTransactions(transactions);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/transactions', (req, res) => {
  const { productId, type, quantity } = req.body;
  const products = readProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (type === 'sell' && product.quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  if (type === 'add') {
    product.quantity += parseInt(quantity);
    product.totalStocked += parseInt(quantity);
  } else if (type === 'sell') {
    product.quantity -= parseInt(quantity);
    product.totalSold += parseInt(quantity);
  }
  writeProducts(products);

  const transactions = readTransactions();
  transactions.push({ productId, type, quantity: parseInt(quantity), date: new Date().toISOString() });
  writeTransactions(transactions);

  res.json({ success: true, product });
});

app.get('/transactions', (req, res) => {
  const transactions = readTransactions();
  res.json(transactions.slice(-5));
});

app.get('/', (req, res) => {
  res.json({ message: 'Wings Cafe Inventory API. Use /products or /transactions endpoints or visit http://localhost:3000' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});