import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Form, Modal, Tooltip } from 'antd';
import thinkAI from '../assets/ThinkAI.jpeg';
import na from '../assets/na.jpeg';
import { SunMedium, Moon } from 'lucide-react';
import {
  FileAddOutlined,
  LogoutOutlined,
  UserOutlined,
  BookOutlined,
  LeftOutlined,
  RightOutlined,
  RightSquareOutlined,
  LeftSquareOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem('sidebarCollapsed') === 'true' || false
  );
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const showLogoutModal = () => {
    setLogoutModalVisible(true);
  };

  const hideLogoutModal = () => {
    setLogoutModalVisible(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLogin');
    navigate('/login');
    hideLogoutModal();
  };

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  // Retrieve role and email from local storage
  const role = JSON.parse(localStorage?.getItem('role'));
  const email = JSON.parse(localStorage?.getItem('user')).email;

  return (
    <Sider
      width={200}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapse}
      trigger={null} // Hide default trigger to create a custom one
      style={{
        background: darkMode ? '#001529' : '#8A2BE2',
        height: '100vh',
        color: darkMode ? 'white' : 'black',
        position: 'relative',
      }}
    >
      <div
        className="logo"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <img
          src={collapsed ? thinkAI : na}
          alt="Logo"
          style={{
            width: collapsed ? '50px' : '130px',
            height: '40px',
            marginTop: '20px',
            borderRadius: '10px',
            alignContent: 'center'
          }}
        />
      </div>
      <Menu
        mode="vertical"
        theme={darkMode ? 'dark' : 'light'}
        defaultSelectedKeys={['1']}
        selectedKeys={[location.pathname]}
        style={{
          borderRight: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: darkMode ? '#001529' : '#8A2BE2',
        }}
      >
        
        <Menu.Item
          key="/"
          icon={<FileAddOutlined />}
          style={{ color: darkMode ? 'white' : 'black' }}
        >
          <Link to="/">Create Asset</Link>
        </Menu.Item>
        <Menu.Item
          key="/ast"
          icon={<BookOutlined />}
          style={{ color: darkMode ? 'white' : 'black' }}
        >
          <Link to="/ast">Asset</Link>
        </Menu.Item>
        {role === 'role2' && (
          <Menu.Item
            key="/register"
            icon={<PlusOutlined />}
            style={{ color: darkMode ? 'white' : 'black' }}
          >
            <Link to="/register"> Add User</Link>
          </Menu.Item>
        )}
        {!collapsed ? (
          <Form.Item
            key="/userprofile-logout"
            style={{ margin: '0px', marginTop: 'auto' }}
          >
            <Button.Group style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Tooltip title={email}>
                <Menu.Item
                  icon={<UserOutlined />}
                  style={{ color: darkMode ? 'white' : 'black', flex: 9, borderRight: 'none' }}
                >
                  {role && role !== 'role4' ? (
                    <span>{email}</span>
                  ) : (
                    <Link to="/userprofile">User Profile</Link>
                  )}
                </Menu.Item>
              </Tooltip>
              <Tooltip title="Logout">
                <Menu.Item
                  icon={<LogoutOutlined />}
                  style={{ color: darkMode ? 'white' : 'black', flex: 1 }}
                  onClick={showLogoutModal}
                />
              </Tooltip>
            </Button.Group>
          </Form.Item>
        ) : (
          <Menu.Item
            key="/logout"
            icon={<LogoutOutlined />}
            style={{ color: darkMode ? 'white' : 'black' }}
            onClick={showLogoutModal}
          />
        )}
      </Menu>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          onClick={toggleDarkMode}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '10px',
            backgroundColor: darkMode ? '#001529' : '#8A2BE2',
          
            
            transition: 'background-color 0.3s, border-color 0.3s',
            marginBottom: '10px',
            hover: {
              backgroundColor: darkMode ? '#000f29' : '#7b1fab',
              borderColor: darkMode ? '#ffffffaa' : '#000000aa',
            }
          }}
        >
          {darkMode ? <Moon style={{ fontSize: '16px', color: darkMode ? 'white' : 'black' }} /> : <SunMedium style={{ fontSize: '16px', color: darkMode ? 'white' : 'black' }} />}
        </div>
        <div
  onClick={toggleCollapse}
  style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '10px',
    backgroundColor: darkMode ? '#001529' : '#8A2BE2',
    transition: 'background-color 0.3s, border-color 0.3s',
    hover: {
      backgroundColor: darkMode ? '#000f29' : '#7b1fab',
      borderColor: darkMode ? '#ffffffaa' : '#000000aa',
    }
  }}
>
  {collapsed ? (
    <RightSquareOutlined
      style={{
        fontSize: '30px', 
        color: darkMode ? 'black' : 'black', // Icon color
        backgroundColor: 'white', // Icon background color
        borderRadius: '4px' // Optional: to make the background square or rounded
      }}
    />
  ) : (
    <LeftSquareOutlined
      style={{
        fontSize: '30px', // Increase the size
        color: darkMode ? 'black' : 'black', // Icon color
        backgroundColor: 'white', // Icon background color
        borderRadius: '4px' // Optional: to make the background square or rounded
      }}
    />
  )}
</div>

      </div>

      <Modal
        title="Logout Confirmation"
        visible={logoutModalVisible}
        onOk={handleLogout}
        onCancel={hideLogoutModal}
        okText="Ok"
        cancelText="Cancel"
      >
        <p>Are you sure you want to logout?</p>
      </Modal>
    </Sider>
  );
};

export default Sidebar;





















