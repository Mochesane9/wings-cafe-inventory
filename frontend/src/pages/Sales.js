import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = "https://wings-cafe-inventory-nine.vercel.app";

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [saleData, setSaleData] = useState({ productId: '', quantity: 0 });
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/products`)
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
    axios.post(`${API_BASE}/transactions`, { 
      productId: saleData.productId, 
      type: 'sell', 
      quantity: saleData.quantity 
    })
    .then(() => {
      setSaleData({ productId: '', quantity: 0 });
      setTotal(0);
      setError('');
      // Refresh products to reflect updated stock
      axios.get(`${API_BASE}/products`)
        .then(res => setProducts(res.data));
    })
    .catch(err => setError(err.response?.data?.error || 'Error recording sale.'));
  };

  return
