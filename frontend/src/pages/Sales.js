import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Backend API base (Render backend, not Vercel frontend)
const API_BASE = "https://wings-cafe-inventory-747n.onrender.com";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [saleData, setSaleData] = useState({ productId: '', quantity: 0 });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  // Load products
  useEffect(() => {
    axios.get(`${API_BASE}/products`)
      .then(res => setProducts(res.data))
      .catch(err => setError('Failed to load products.'));
  }, []);

  // Load recent sales
  useEffect(() => {
    axios.get(`${API_BASE}/transactions`)
      .then(res => setSales(res.data))
      .catch(err => console.error("Failed to load sales", err));
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...saleData, [name]: value };
    setSaleData(updatedData);

    const product = products.find(p => p.id === updatedData.productId);
    setTotal(product ? product.price * updatedData.quantity : 0);
  };

  // Handle sale submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!saleData.productId || saleData.quantity <= 0) {
      setError('Please select a product and enter a valid quantity.');
      return;
    }

    axios.post(`${API_BASE}/transactions`, {
      productId: saleData.productId,
      type: 'sell',
      quantity: parseInt(saleData.quantity, 10)
    })
      .then(() => {
        setSaleData({ productId: '', quantity: 0 });
        setTotal(0);
        setError('');

        // Refresh products
        axios.get(`${API_BASE}/products`)
          .then(res => setProducts(res.data));

        // Refresh sales
        axios.get(`${API_BASE}/transactions`)
          .then(res => setSales(res.data));
      })
      .catch(err => setError(err.response?.data?.error || 'Error recording sale.'));
  };

  return (
    <div className="container">
      <h1>Sales Management</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} className="sales-form">
        <label>Product:</label>
        <select name="productId" value={saleData.productId} onChange={handleChange} required>
          <option value="">Select Product</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (Qty: {p.quantity}, M {p.price})
            </option>
          ))}
        </select>

        <label>Quantity:</label>
        <input
          name="quantity"
          type="number"
          placeholder="Quantity to Sell"
          value={saleData.quantity}
          onChange={handleChange}
          min="1"
          required
        />

        <p>Total: M {total.toFixed(2)}</p>
        <button type="submit">Record Sale</button>
      </form>

      <h2>Recent Sales</h2>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total (M)</th>
          </tr>
        </thead>
        <tbody>
          {sales.length > 0 ? (
            sales.map((s, i) => {
              const product = products.find(p => p.id === s.productId);
              return (
                <tr key={i}>
                  <td>{product ? product.name : "Unknown"}</td>
                  <td>{s.quantity}</td>
                  <td>M {(product ? product.price * s.quantity : 0).toFixed(2)}</td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan="3">No recent sales</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Sales;
