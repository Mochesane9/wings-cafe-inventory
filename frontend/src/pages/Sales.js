import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [saleData, setSaleData] = useState({ productId: '', quantity: 0 });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/products')
      .then(res => setProducts(res.data))
      .catch(err => setError('Failed to load products.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...saleData, [name]: parseInt(value) || 0 };
    setSaleData(updatedData);
    const product = products.find(p => p.id === updatedData.productId);
    setTotal(product ? product.price * updatedData.quantity : 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!saleData.productId || saleData.quantity <= 0) {
      setError('Please select a product and enter a valid quantity.');
      return;
    }
    axios.post('http://localhost:5000/transactions', { 
      productId: saleData.productId, 
      type: 'sell', 
      quantity: saleData.quantity 
    })
    .then(() => {
      setSaleData({ productId: '', quantity: 0 });
      setTotal(0);
      setError('');
      // Refresh products to reflect updated stock
      axios.get('http://localhost:5000/products')
        .then(res => setProducts(res.data));
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
          <tr><td colSpan="3">No recent sales</td></tr>
        </tbody>
      </table>
    </div>
  );
};

export default Sales;