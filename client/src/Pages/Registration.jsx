import React, { useState } from "react";
import { Form, Input, Button, Row, Col, Typography, message, Select } from "antd";
import { UserOutlined } from "@ant-design/icons";
import thinkAIlogo from '../assets/thinkAIlogo.png';
import { server } from "../constant";
import bcrypt from 'bcryptjs'; // Import bcryptjs library
import Layout from '../Components/Layout'

const { Title } = Typography;
const { Option } = Select;

const RegistrationPage = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(values.password, 10); // You can adjust the salt rounds (10 is a reasonable default)

      // Replace the plain password with the hashed one
      values.password = hashedPassword;

      // Make API call to the backend for registration
      const response = await fetch(`${server}/registerUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('Registration successful! You can now login.');
        form.resetFields(); // Clear form fields after successful registration
      } else {
        const errorData = await response.json();
        setError("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Styles for the form
  const formContainerStyle = {
    width: "300px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const pinkInputStyle = {
    borderColor: "pink",
  };

  // Render the registration form
  return (
    <Layout>
    <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
      <Col span={8} style={formContainerStyle}>
        {/* <img
          src={thinkAIlogo}
          alt="Logo"
          style={{
            width: '80px',
            height: '80px',
            marginTop: '20px',
            borderRadius: '10px',
            marginLeft: '200px',
            justifyContent:'center',
            alignItems:'center',
            display:'flex',
          }}
        /> */}

        <Title level={3} style={{ textAlign: "center", marginBottom: "20px" }}>
          Add User
        </Title>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Name"
            name="CreatedBy"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input prefix={<UserOutlined />} style={pinkInputStyle} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input style={pinkInputStyle} />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password style={pinkInputStyle} />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select a role" style={pinkInputStyle}>
              <Option value="role1">HR </Option>
              <Option value="role2">Manager</Option>
              <Option value="role3">Finance</Option>
            </Select>
          </Form.Item>

          {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%" }}
              loading={loading}
            >
              Register
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
    </Layout>
  );
};

export default RegistrationPage;