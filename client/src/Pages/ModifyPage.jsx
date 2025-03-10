

import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import { Form, Input, Button, Row, Col, message, Upload } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { server } from '../constant';
import { UploadOutlined} from '@ant-design/icons';
import axios from 'axios';

const ModifyPage = () => {
  const { state } = useLocation();
  const [form] = Form.useForm();
  const [pdfUrl, setPdfUrl] = useState('');
  const navigate = useNavigate();
  const [totalPrice, setTotalPrice] = useState(state.record.totalPrice || 0);
  const [totalPriceWithGST, setTotalPriceWithGST] = useState(state.record.totalPriceWithGST || 0);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleQuantityChange = (value) => {
    const unitPrice = form.getFieldValue('unitPrice');
    const totalPrice = value && unitPrice ? parseFloat(value) * parseFloat(unitPrice) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice.toFixed(2), 'totalPriceWithGST': totalPriceWithGST.toFixed(2) });
  };

  const handleUnitPriceChange = (value) => {
    const quantity = form.getFieldValue('Quantity');
    const totalPrice = quantity && value ? parseFloat(quantity) * parseFloat(value) : 0;
    const totalPriceWithGST = totalPrice * 1.18; // Assuming GST is 18%
    setTotalPrice(totalPrice);
    setTotalPriceWithGST(totalPriceWithGST);
    form.setFieldsValue({ 'totalPrice': totalPrice.toFixed(2), 'totalPriceWithGST': totalPriceWithGST.toFixed(2) });
  };

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await fetch(`${server}/getPdf/${state.record._id}`);
        if (response.ok) {
          const { url } = await response.json();
          setPdfUrl(url);
        } else {
          console.error('Failed to fetch PDF');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchPdf();
  }, [state.record._id]);

  // const handleSubmit = async (values) => {
  //   try {
  //     // Get the user's name from local storage
  //     const userName = localStorage.getItem('name');
  
  //     // Include remarks and UpdatedBy in the request body
  //     const formData = {
  //       ...values,
  //       remarks: [values.remarks],
  //       UpdatedBy: userName, // Include the user's name
  //     };
  
  //     const response = await fetch(`${server}/modifyAsset/${state.record._id}`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(formData),
  //     });
  
  //     if (response.ok) {
  //       message.success("Asset modified successfully");
  //       form.resetFields();
  //       navigate('/inboxpage');
  //     } else {
  //       console.error('Error modifying asset.');
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //   }
  // };




  const handleSubmit = async (values) => {
    try {
      setSubmitting(true); // Set submitting state to true
    
      const userName = localStorage.getItem('name');
      const formData = {
        ...values,
        remarks: [values.remarks],
        UpdatedBy: userName,
        pdfUrl: pdfUrl,
      };
  
      if (uploadedDocument) {
        const newPdfUrl = await uploadDocumentToS3(uploadedDocument);
        if (newPdfUrl) {
          formData.pdfUrl = newPdfUrl;
        }
      }
  
      const response = await fetch(`${server}/modifyAsset/${state.record._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      if (response.ok) {
        message.success("Asset modified successfully");
        form.resetFields();
        navigate('/inboxpage');
      } else {
        console.error('Error modifying asset.');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false); // Set submitting state back to false
    }
  };
  
  
  


  
  const uploadDocumentToS3 = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
  
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
      message.error('Failed to upload document.');
      return null;
    }
  };
  
  


  const uploadProps = {
    name: 'file',
    showUploadList: false,
    beforeUpload: (file) => {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error('Invalid file format. Please upload a PDF file.');
      }
      return isPDF;
    },
    customRequest: async ({ file, onSuccess }) => {
      try {
        const newUrl = await uploadDocumentToS3(file);
        if (newUrl) {
          setPdfUrl(newUrl); // Update the PDF URL
          setUploadedDocument(file); // Set the uploaded document
          onSuccess();
        }
      } catch (error) {
        console.error('Failed to upload document:', error);
        message.error('Failed to upload document.');
      }
    },
  };
  
  
  
  return (
    <Layout>
      <Row gutter={24}>
        <Col xs={24} sm={24} md={12}>
          <div style={{ backgroundColor: 'white', padding: '5px', minHeight: '70vh' }}>
            <h1>Modify Asset Page</h1>
            <Form layout="vertical" form={form} onFinish={handleSubmit} style={{ maxHeight:'70vh'}}>
              <Form.Item label="Asset Type" name="assetType" initialValue={state.record.assetType}>
                <Input disabled />
              </Form.Item>
              {/* <Form.Item label="Quantity" name="Quantity" initialValue={state.record.Quantity} rules={[{ required: true, message: 'Please enter the quantity' }]}>
                <Input onChange={(e) => handleQuantityChange(e.target.value)} />
              </Form.Item> */}

              <Form.Item
                label="Quantity"
                name="Quantity"
                initialValue={state.record.Quantity}
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
                  onInput={(e) =>
                    
                    {e.target.value = e.target.value.replace(/[^\d]/g, '');


                  }}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                />
              </Form.Item>
{/*               
              <Form.Item label="Unit Price" name="unitPrice" initialValue={state.record.unitPrice} rules={[{ required: true, message: 'Please enter the unit price' }]}>
                <Input onChange={(e) => handleUnitPriceChange(e.target.value)} />
              </Form.Item> */}
                 
                 <Form.Item
  label="Unit Price"
  name="unitPrice"
  initialValue={state.record.unitPrice}
  rules={[
    { required: true, message: 'Please enter the unit price' },
    {
      validator: (_, value) => {
        if (value !== undefined && parseInt(value) === 0 && parseInt(value) >= 0) {
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
    }}
    onChange={(e) => handleUnitPriceChange(e.target.value)}
  />
</Form.Item>


              <Form.Item label="Total Price" name="totalPrice" initialValue={totalPrice.toFixed(2)} rules={[{ required: true, message: 'Please enter the total price' }]}>
                <Input disabled />
              </Form.Item>
              <Form.Item label="Total Price with GST" name="totalPriceWithGST" initialValue={totalPriceWithGST.toFixed(2)} rules={[{ required: true, message: 'Please enter the total price with GST' }]}>
                <Input disabled />
              </Form.Item>
              <Form.Item label="Remarks" name="remarks"    
                initialValue={state.record.remarks && state.record.remarks.length > 0 ? state.record.remarks[state.record.remarks.length - 1] : ''}
                rules={[{ required: true, message: 'Please mention the remarks' }]} >
                <Input  />
              </Form.Item>
              <Form.Item >
                <Button type="primary" htmlType="submit" loading={submitting}>Submit</Button>
              </Form.Item>
            </Form>
          </div>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <div style={{ border: '1px solid lightpink', minHeight: '80%', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* <h2>Uploaded PDF</h2>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} > Reupload PDF</Button>
            </Upload> */}
            <div style={{ width: '100%', overflowY: 'auto', marginTop: '10px' }}>
              {pdfUrl ? (
                <iframe src={pdfUrl} type="application/pdf" width="100%" height="500px" />
              ) : (
                <p>No PDF available</p>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

export default ModifyPage;














