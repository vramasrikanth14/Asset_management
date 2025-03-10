import React, { useState } from 'react';
import Layout from '../Components/Layout';
import { Row, Col, Form, Select, Input, Button, Upload, Empty, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { server } from '../constant';

const { Option } = Select;

const CreateAsset = () => {
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [form] = Form.useForm();
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalPriceWithGST, setTotalPriceWithGST] = useState(0);
  const [loading, setLoading] = useState(false); // New state to manage loading state
  const userRole = getUserRoleFromAuth();

  const handleQuantityChange = (value) => {
    const unitPrice = form.getFieldValue('unitPrice');
    const totalPrice = value && unitPrice ? parseFloat(value) * parseFloat(unitPrice) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice, 'totalPriceWithGST': totalPriceWithGST.toFixed(2) });
  };

  const handleUnitPriceChange = (value) => {
    const quantity = form.getFieldValue('Quantity');
    const totalPrice = quantity && value ? parseFloat(quantity) * parseFloat(value) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice.toFixed(2), 'totalPriceWithGST': totalPriceWithGST.toFixed(2) });
  };

  const handleSubmit = async (values) => {
    try {
      if (!uploadedDocument) {
        message.error('Please upload the document');
        return;
      }
      setLoading(true); // Set loading state to true
      const documentUrl = await uploadDocumentToS3();
      values.url = documentUrl;

      // Get user name from local storage
      const userName = JSON.parse(localStorage.getItem('name'));
      values.CreatedBy = userName; // Add the user's name to the form data
   
      const currentDate = new Date().toLocaleDateString('en-IN', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
      });
      values.CreatedDate = currentDate;


      const response = await axios.post(`${server}/submitForm`, values);

      if (response.status === 200) {
        console.log('Form data sent to the API successfully.');
        form.resetFields();
        setTotalPrice(0);
        setTotalPriceWithGST(0);
        setUploadedDocument(null);
        message.success('Asset request created successfully.');
      } else {
        console.error('Error sending form data to the API.');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const uploadDocumentToS3 = async () => {
    try {
      const formData = new FormData();
      formData.append('file', uploadedDocument);

      const response = await axios.post(`${server}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.url) {
        return response.data.url;
      } else {
        message.error('Invalid API response. URL not found.');
        return null;
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      return null;
    }
  };


  const uploadProps = {
    name: 'file',
    showUploadList: false,
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf';
      const isLt5M = file.size / 1024 / 1024 < 5;
  
      if (!isPDF) {
        message.error('Invalid file format. Please upload a PDF file.');
      }
      if (!isLt5M) {
        message.error('File size should be less than 5 MB.');
      }
  
      return isPDF && isLt5M;
    },
    customRequest: ({ file, onSuccess }) => {
      setUploadedDocument(file);
      onSuccess();
    },
  };
  
  
  return (
    <Layout>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12} style={{ marginTop: '40px' }}>
          <div style={{ width: '100%', height: '100%' }}>
            <Form
              style={{ backgroundColor: 'white', padding: '10px', minHeight: '80%' }}
              layout="vertical"
              onFinish={handleSubmit}
              form={form}
            >
              <h1 style={{ display: 'flex' }}>Create Asset Request Form</h1>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Asset Type"
                    name="assetType"
                    rules={[{ required: true, message: 'Please select the asset type' }]}
                  >
                    <Select style={{ width: '100%' }} placeholder="Select the asset" disabled={userRole === 'role2' || userRole === 'role3'}>
                      <Option value="laptop">Laptop</Option>
                      <Option value="monitor">Monitor</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Quantity"
                    name="Quantity"
                    
                    rules={[
                      { required: true, message: 'Please enter the quantity' },
                      {
                        validator: (_, value) => {
                          if (value !== undefined && parseInt(value) === 0) {
                            return Promise.reject('Quantity should be greater than zero');
                          }
                          if(value!=undefined && value.length>4){
                            return Promise.reject('Unit price should not be exceed more than 4 characters ');
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input
                      style={{ width: '100%' }}
                    
                      type='number'
                      
                      onKeyDown={(e) => e.key === '.' && e.preventDefault()}
                      onInput={(e) => {
                      
                        e.target.value = e.target.value.replace(/[^\d]/g, '');
                       
                       
                      }}
                      
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      disabled={userRole === 'role2' || userRole === 'role3'}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                <Form.Item
  label="Unit Price"
  name="unitPrice"
  rules={[
    { required: true, message: 'Please enter the unit price' },
    {
      validator: (_, value) => {
        if (value !== undefined && parseInt(value) === 0) {
          return Promise.reject('Unit price should be greater than one');
        }
        if (value !== undefined && value.length > 10) {
          return Promise.reject('Unit price should not exceed more than 10 characters');
        }
        return Promise.resolve();
      },
    },
  ]}
>
  <Input
    style={{ width: '100%' }}
    type='text'
    onKeyDown={(e) => {
      if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }
    }}
    onInput={(e) => {
      let value = e.target.value;

      // Prevent the first character from being a period
      if (value.startsWith('.')) {
        value = value.replace('.', '');
      }

      // Remove any non-digit and non-period characters
      value = value.replace(/[^\d.]/g, '');

      // Ensure only one period is allowed
      value = value.replace(/(\..*)\./g, '$1');

      e.target.value = value;
      handleUnitPriceChange(value);

      // if (e.target.value.length > 10) {
      //   e.target.value = e.target.value.slice(0, 10);
      // }
    }}
    disabled={userRole === 'role2' || userRole === 'role3'}
  />
</Form.Item>

                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Total Price"
                    name="totalPrice"
                    rules={[
                     
                      {
                        validator: (_, value) => {
                          if (value !== undefined && parseInt(value) === 0) {
                            return Promise.reject('Total price should be greater than one');
                          }
                         
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input style={{ width: '100%' }} value={totalPrice.toFixed(2)} disabled />
                  </Form.Item>
                </Col>
                <Form.Item
                  label="Total Price with GST"
                  name="totalPriceWithGST"
                >
                  <Input
                    style={{ width: '100%' }}
                    value={totalPriceWithGST.toFixed(2)}
                    disabled
                  />
                </Form.Item>
              </Row>
              <Row>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      style={{ width: '100px', height: '45px', marginTop: '20px' }}
                      disabled={userRole === 'role2' || userRole === 'role3' || loading} // Disable based on loading state
                    >
                      Submit
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Col>
        <Col xs={24} sm={12} md={12} style={{ border: '1px solid lightpink', marginTop: '40px', overflowY: 'auto' }}>
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'scroll' }}
            disabled={userRole == 'role2' || userRole == 'role3'}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} disabled={userRole === 'role2' || userRole === 'role3'}>Click to Upload PDF</Button>
            </Upload>
            <div style={{ width: '100%', overflowY: 'auto', marginTop: '10px' }}>
              {uploadedDocument ? (
                <embed src={URL.createObjectURL(uploadedDocument)} type="application/pdf" style={{ width: '100%', height: '300px' }} />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

// Function to get user role from local storage
function getUserRoleFromAuth() {
  const loggedInUserRole = JSON.parse(localStorage.getItem('role'));
  return loggedInUserRole;
}

export default CreateAsset;










