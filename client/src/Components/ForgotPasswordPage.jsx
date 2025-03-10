import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { server } from "../constant";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const response = await fetch(`${server}/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success("OTP sent to your email");
        navigate("/verify-otp", { state: { email: values.email } });
      } else {
        const errorData = await response.json();
        message.error(errorData.message);
      }
    } catch (error) {
      console.error("Error during forgot password request:", error);
      message.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleSubmit} layout="vertical">
      <Form.Item
        label="Email"
        name="email"
        rules={[{ required: true, message: "Please enter your email" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Request OTP
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ForgotPassword;
