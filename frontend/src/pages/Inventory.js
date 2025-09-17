import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = "https://wings-cafe-inventory-747n.onrender.com";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', category: '', price: 0, quantity: 0 });
  const [editId, setEditId] = useState(null);
  const [addStockData, setAddStockData] = useState({ productId: '', quantity: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    axios.get(`${API_BASE}/products`)
      .then(res => setProducts(res.data))
      .catch(err => setError('Failed to load products. Check backend connection.'));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData, price: parseFloat(formData.price), quantity: parseInt(formData.quantity) };
    if (editId) {
      axios.put(`${API_BASE}/products/${editId}`, payload)
        .then(() => {
          fetchProducts();
          resetForm();
          setError('');
        })
        .catch(err => setError(`Error updating product: ${err.response?.data?.error || err.message}`));
    } else {
      axios.post(`${API_BASE}/products`, payload)
        .then(() => {
          fetchProducts();
          resetForm();
          setError('');
        })
        .catch(err => setError(`Error adding product: ${err.response?.data?.error || err.message}`));
    }
  };

  const handleEdit = (p) => {
    setFormData({ name: p.name, description: p.description, category: p.category, price: p.price, quantity: p.quantity });
    setEditId(p.id);
  };

  const handleDelete = (id) => {
    axios.delete(`${API_BASE}/products/${id}`)
      .then(() => fetchProducts())
      .catch(err => setError(`Error deleting product: ${err.response?.data?.error || err.message}`));
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', price: 0, quantity: 0 });
    setEditId(null);
  };

  const handleAddStockChange = (e) => {
    setAddStockData({ ...addStockData, [e.target.name]: e.target.value });
  };

  const handleAddStock = (e) => {
    e.preventDefault();
    axios.post(`${API_BASE}/transactions`, { productId: parseInt(addStockData.productId), type: 'add', quantity: parseInt(addStockData.quantity) })
      .then(() => {
        fetchProducts();
        setAddStockData({ productId: '', quantity: 0 });
        setError('');
      })
      .catch(err => setError(`Error adding stock: ${err.response?.data?.error || err.message}`));
  };

  return (
    <div className="container">
      <h1>Inventory</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>{editId ? 'Update Product' : 'Add Product'}</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
        <input name="price" type="number" step="0.01" placeholder="Price (M)" value={formData.price} onChange={handleChange} required />
        <input name="quantity" type="number" placeholder="Initial Quantity" value={formData.quantity} onChange={handleChange} required />
        <button type="submit">{editId ? 'Update' : 'Add'}</button>
      </form>
      <h2>Add Stock to Existing Product</h2>
      <form onSubmit={handleAddStock}>
        <select name="productId" value={addStockData.productId} onChange={handleAddStockChange} required>
          <option value="">Select Product</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="quantity" type="number" placeholder="Quantity to Add" value={addStockData.quantity} onChange={handleAddStockChange} required />
        <button type="submit">Add Stock</button>
      </form>
      <h2>Products</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Category</th>
            <th>Price (M)</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>{p.category}</td>
              <td>M {p.price}</td>
              <td>{p.quantity}</td>
              <td>
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
