





import React, { useState, useEffect } from "react";
import { Form, Input, Button, Row, Col, Typography, message } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import thinkAIlogo from '../assets/thinkAIlogo.png';
import { server } from "../constant";

const { Title } = Typography;

const LoginPage = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isLogin = localStorage.getItem("isLogin");

    if (isLogin) {
      const role = JSON.parse(localStorage.getItem("role"));
      redirectBasedOnRole(role);
    }
  }, []);

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case "role1":
      case "role2":
      case "role3":
        navigate("/createast");
        break;
      case "role4":
        navigate("/createast");
        break;
      default:
        navigate("/createast"); // Redirect to a default route if role is not found
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Make API call to the backend for authentication
      const response = await fetch(`${server}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const responseData = await response.json();
        const { role, CreatedBy, user } = responseData;

        localStorage.setItem("isLogin", JSON.stringify(true));
        localStorage.setItem("role", JSON.stringify(role));
        localStorage.setItem("name", JSON.stringify(CreatedBy));
        localStorage.setItem("user", JSON.stringify(user));

        message.success('Login successfully'); 

        navigate("/");

        // redirectBasedOnRole(role);
      } else {
        const errorData = await response.json();
        setError("Invalid Email or Password");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Styles for the form
  const formContainerStyle = {
    width: "200px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const pinkInputStyle = {
    borderColor: "pink",
  };

  // Render the login form
  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col span={8} style={formContainerStyle}>
        <img
          src={thinkAIlogo}
          alt="Logo"
          style={{
            width: '80px',
            height: '80px',
            marginTop: '20px',
            borderRadius: '10px',
            marginLeft: '200px',
            position: 'center'
          }}
        />

        <Title level={3} style={{ textAlign: "center", marginBottom: "20px" }}>
          Login
        </Title>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <center>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
              style={{ width: "50%", alignContent: "center" }}
            >
              <Input style={pinkInputStyle} />
            </Form.Item>
          </center>

          <center>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
              style={{ width: "50%", alignContent: "center" }}
            >
              <Input.Password style={pinkInputStyle} />
            </Form.Item>
          </center>

          {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

          <center>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  width: "30%",
                  color: "white",
                  backgroundColor: "#7a00cc",
                }}
                loading={loading}
              >
                Sign In
              </Button>
            </Form.Item>
          </center>
        </Form>
      </Col>
    </Row>
  );
};

export default LoginPage;




















