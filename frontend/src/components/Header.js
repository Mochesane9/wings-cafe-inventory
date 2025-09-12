import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <img src="/images/logo.png" alt="Wings Cafe Logo" className="logo" />
      <nav>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/inventory">Inventory</Link></li>
          <li><Link to="/sales">Sales</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;