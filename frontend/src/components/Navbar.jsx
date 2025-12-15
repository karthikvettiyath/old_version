import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header style={{ background: '#2c3e50', color: '#fff', padding: '0.5rem 0', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo">
          <h1 style={{ fontSize: '1.8rem' }}>Legal<span style={{ color: '#3498db' }}>Expert</span></h1>
        </div>
        
        <nav>
          <ul style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="desktop-nav">
            <li><a href="#home" style={{ color: '#fff' }}>Home</a></li>
            <li><a href="#services" style={{ color: '#fff' }}>Services</a></li>
            <li><a href="#about" style={{ color: '#fff' }}>About Us</a></li>
            <li><a href="#contact" style={{ color: '#fff' }}>Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;