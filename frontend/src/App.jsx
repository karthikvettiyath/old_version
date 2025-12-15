import React from 'react';
import Navbar from './components/Navbar';
import SearchSection from './components/SearchSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <SearchSection />
      <Footer />
    </div>
  );
}

export default App;