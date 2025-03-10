import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout } from 'antd';
import Createast from './Pages/Createast';
import Ast from './Pages/Asset';
import InboxPage from './Pages/InboxPage';
import ModifyPage from './Pages/ModifyPage';
import LoginPage from './Pages/LoginPage';
import Protected from './Components/protected';
import RegistrationPage from './Pages/Registration';
import darkMode from './Components/Sidebar';
import RoleProtectedRoute from './Components/RoleProtectedRoute';
import VerifyOTP from './Components/VerifyOTP';
import ResetPassword from './Components/ResetPassword';
import ForgotPassword from './Components/ForgotPasswordPage';
const { Content } = Layout;

const App = () => {
  return (
    <Router >
      <Layout style={{ minHeight: '100vh' }}>
        <Layout>
          <Content>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path='/verify-otp' element= {<VerifyOTP />} />
              {/* <Route path='/reset-password'  element ={<ResetPassword />} />
              <Route path='/forgot-password' element={<ForgotPassword />} /> */}
              <Route

                path="/"
                element={
                  <Protected>
                    <Createast />
                  </Protected>
                }
              />
              <Route
                path="/ast"
                element={
                  <Protected>
                    <Ast darkMode={darkMode} />
                  </Protected>
                }
              />
               <Route
                path="/register"
                element={
                  <Protected>
                    <RoleProtectedRoute allowedRoles={['role2']}>
                      <RegistrationPage />
                    </RoleProtectedRoute>
                  </Protected>
                }
              />
              <Route
                path="/inboxpage"
                element={
                  <Protected>
                    <InboxPage darkMode={darkMode} />
                  </Protected>
                }
              />
              <Route
                path="/ModifyPage"
                element={
                  <Protected>
                    <ModifyPage />
                  </Protected>
                }
              />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};
export default App;

