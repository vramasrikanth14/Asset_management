import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { server } from "../constant";

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = location.state;

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const response = await fetch(`${server}/api/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, email, otp }),
      });

      if (response.ok) {
        message.success("Password reset successful");
        navigate("/login");
      } else {
        const errorData = await response.json();
        message.error(errorData.message);
      }
    } catch (error) {
      console.error("Error during password reset:", error);
      message.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleSubmit} layout="vertical">
      <Form.Item
        label="New Password"
        name="newPassword"
        rules={[{ required: true, message: "Please enter your new password" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Reset Password
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResetPassword;
