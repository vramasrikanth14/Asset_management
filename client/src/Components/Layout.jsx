import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || false
  );

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: darkMode ? '#001529' : '#f2f2f2', color: darkMode ? 'white' : 'black' }}>
        <div style={{ height: '50px', width: '100%', backgroundColor: 'rgb(255, 255, 255)', zIndex: 50 }}>
          <Navbar />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '1%' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;







