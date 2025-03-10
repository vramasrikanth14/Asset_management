import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { server } from "../constant";

const VerifyOTP = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state;

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const response = await fetch(`${server}/api/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, email }),
      });

      if (response.ok) {
        message.success("OTP verified");
        navigate("/reset-password", { state: { email, otp: values.otp } });
      } else {
        const errorData = await response.json();
        message.error(errorData.message);
      }
    } catch (error) {
      console.error("Error during OTP verification:", error);
      message.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleSubmit} layout="vertical">
      <Form.Item
        label="OTP"
        name="otp"
        rules={[{ required: true, message: "Please enter the OTP" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Verify OTP
        </Button>
      </Form.Item>
    </Form>
  );
};

export default VerifyOTP;
