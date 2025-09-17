import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Reporting = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('https://wings-cafe-inventory-747n.onrender.com/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  const totalRevenue = products.reduce((acc, p) => acc + (p.totalSold * p.price), 0);

  return (
    <div className="container">
      <h1>Reporting</h1>
      <p>Total Revenue: M {totalRevenue.toFixed(2)}</p>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Total Stocked</th>
            <th>Total Sold</th>
            <th>Revenue (M)</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.totalStocked}</td>
              <td>{p.totalSold}</td>
              <td>M {(p.totalSold * p.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reporting;
