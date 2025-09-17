import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('https://wings-cafe-inventory-747n.onrender.com/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  const totalValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Total Stock Value: M {totalValue.toFixed(2)}</p>
      <h2>Stock Overview</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Value (M)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.quantity}</td>
              <td>M {(p.price * p.quantity).toFixed(2)}</td>
              <td>{p.quantity < 5 ? <span className="low-stock">Low Stock Alert!</span> : 'OK'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Our Menu</h2>
      <div className="gallery">
        <img src="/images/food-plate.jpg" alt="Food Plate" />
        <img src="/images/chinese-noodles.jpg" alt="Chinese Noodles" />
        <img src="/images/fried-balls.jpg" alt="Fried Balls" />
        <img src="/images/menu-board.jpg" alt="Menu Board" />
      </div>
    </div>
  );
};

export default Dashboard;
