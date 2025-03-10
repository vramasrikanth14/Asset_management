import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const Navbar = ({ darkMode }) => {
  return (
    <nav style={{ backgroundColor: darkMode ? '#001529' : 'white', height: '50px', padding: '13px', display: 'flex', justifyContent: 'flex-end', paddingRight: '80px' }}>
     
      <Link to="/inboxpage" style={{ textDecoration: 'none', color: darkMode ? 'white' : 'black', fontSize: '20px', fontWeight: 'bold' }}>
        <InboxOutlined />&nbsp;
        Inbox
      </Link>
    </nav>
  );
};

export default Navbar;
