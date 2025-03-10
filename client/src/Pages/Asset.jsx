import React, { useState, useEffect } from 'react';
import { Table, Checkbox, Tooltip, Input } from 'antd';
import Layout from '../Components/Layout';
import { server } from '../constant';

const { Column } = Table;
const { Search } = Input;

const renderProgressLevels = (text, record) => {
  const levels = ['level1', 'level2', 'level3'];
  let selectedLevelIndex = levels.indexOf(record.ProgressLevel);
  if (selectedLevelIndex > 0) {
    selectedLevelIndex -= 1;
  }

  let color = 'white'; // Default color for pending

  // Check if the record is approved
  if (record.status === 'Approved') {
    color = '#62bf62'; // Green color for approved
  } else if (record.status === 'Pending' && record.ProgressLevel === 'level2') {
    color = '#62bf62';
  } else if (record.status === 'Rejected') {
    color = 'red'; // Red color for rejected
  }

  const tooltipContent =
    record.status === 'Approved' || record.ProgressLevel === 'level2'
      ? `Approved By: ${record.ApproveBy}\nApproved Date: ${record.ApproveDate}`
      : record.status === 'Rejected'
      ? `Rejected By: ${record.RejectBy}\nRejected Date: ${record.RejectDate}`
      : null;

  return (
    <Tooltip title={tooltipContent}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {levels.slice(0, levels.length - 1).map((level, index) => (
          <React.Fragment key={level}>
            {index > 0 && (
              <div
                style={{
                  width: '20px',
                  height: '1px',
                  backgroundColor: 'black',
                  margin: '0 5px',
                }}
              />
            )}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: index <= selectedLevelIndex ? color : 'transparent',
                border: '1px solid black',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {level.replace('level', '')}
            </div>
          </React.Fragment>
        ))}
      </div>
    </Tooltip>
  );
};

const Ast = (darkMode) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filteredStatus, setFilteredStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredData(getFilteredData());
  }, [data, filteredStatus]);

  const getFilteredData = () => {
    if (!filteredStatus) {
      return data;
    }
    return data.filter((item) =>
      item.status.toLowerCase().includes(filteredStatus.toLowerCase())
    );
  };

  const handleSearch = (value) => {
    setFilteredStatus(value);
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${server}/getData`);
      const result = await response.json();
      console.log(result);

      // Add a unique identifier for each asset
      const dataWithUniqueID = result.assets.map((asset, index) => ({
        ...asset,
        uniqueID: index, // You can use a more meaningful unique ID if available
        UpdatedBy: asset.UpdatedBy ? asset.UpdatedBy.replace(/"/g, '') : '',
      }));

      // Sort data based on CreatedDate and uniqueID in descending order
      const sortedData = dataWithUniqueID.sort((a, b) => {
        const dateComparison = new Date(b.CreatedDate) - new Date(a.CreatedDate);
        if (dateComparison === 0) {
          // If dates are equal, compare by uniqueID
          return b.uniqueID - a.uniqueID;
        }
        return dateComparison;
      });

      // Remove the uniqueID after sorting if needed
      const finalData = sortedData.map((asset) => {
        const { uniqueID, ...rest } = asset;
        return rest;
      });

      setData(finalData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handlePaymentChange = async (record) => {
    try {
      const response = await fetch(`${server}/updatePayment/${record._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment: !record.Payment }),
      });

      const result = await response.json();
      console.log(result.message);

      fetchData();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };
  
  const itemRender = (page, type, originalElement) => {
    const textColor = darkMode ? 'blue' : 'black'; // Determine text color based on mode
    if (type === 'prev') {
      return <a style={{ color: textColor }}>Previous</a>;
    }
    if (type === 'next') {
      return <a style={{ color: textColor }}>Next</a>;
    }
    if (type === 'page') {
      const isActive = currentPage === page;
      return (
        <a
          style={{
            fontWeight: isActive ? 'bold' : 'normal',
            color: textColor,
            border: isActive ? '1px solid' : 'none',
            padding: '0 6px',
            borderRadius: '2px',
          }}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </a>
      );
    }
    return originalElement;
  };

  const paginationConfig = {
    pageSize: 4,
    showSizeChanger: false,
    showQuickJumper: false,
    total: filteredData.length,
    showTotal: (total, range) => {
      if (filteredData.length > 0) {
        return (
          <span style={{ color: darkMode ? 'blue' : 'black' }}>
            Showing {range[0]} to {range[1]} of {total} items
          </span>
        );
      } else {
        return '';
      }
    },
    itemRender: itemRender,
    current: currentPage,
    onChange: (page) => setCurrentPage(page)
  };
  return (
    <Layout>
      <div style={{ flex: '1', overflow: 'auto' }}> 
        <h1>Asset Page</h1>
        <div style={{ marginBottom: '16px' }}>
          <Search
            placeholder="Search by status"
            onSearch={handleSearch}
            enterButton
            size="middle"
            style={{ fontSize: '14px', width: '200px' }}
          />
        </div>
        <Table
          dataSource={filteredData}
          pagination={paginationConfig}
          rowKey={(record) => record._id}
          scroll={{ x: '60vw', y: '60vh' }} // Enable both horizontal and vertical scrolling
        >
          <Column title="Asset Type" dataIndex="assetType" key="assetType" width={90} />
          <Column title="Quantity" dataIndex="Quantity" key="Quantity" width={90} />
          <Column title="Unit Price" dataIndex="unitPrice" key="unitPrice" width={100} />
          <Column title="Total Price" dataIndex="totalPrice" key="totalPrice" width={100} />
          <Column title="Total Price with GST" dataIndex="totalPriceWithGST" key="totalPriceWithGST" width={100} />
          <Column title="Created By" dataIndex="CreatedBy" key="CreatedBy" width={100} />
          <Column title="Modified By" dataIndex="UpdatedBy" key="UpdatedBy" width={100} />
          <Column title="Created Date" dataIndex="CreatedDate" key="CreatedDate" width={90} />
          <Column title="Updated Date" dataIndex="UpdatedDate" key="UpdatedDate" width={90} />
          <Column title="Progress Level" dataIndex="ProgressLevel" key="ProgressLevel" render={renderProgressLevels} width={110} />
          <Column title="Status" dataIndex="status" key="status" width={100} />
          <Column
            title="Payment"
            key="payment"
            width={90}
            render={(_, record) => (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Checkbox
                  checked={record.payment}
                  onChange={() => handlePaymentChange(record)}
                  disabled={true} // Always disabled
                />
              </div>
            )}
          />
          <Column
            title="Remark"
            dataIndex="remarks"
            key="remarks"
            width={120}
            render={(remarks) => {
              if (remarks && remarks.length > 0) {
                const numberedRemarks = remarks.map((remark, index) => `${index + 1}. ${remark}`);
                const tooltipContent = (
                  <div style={{ whiteSpace: 'pre-line', maxHeight: '150px', overflowY: 'auto' }}>
                    {numberedRemarks.map((remark) => (
                      <div key={remark}>{remark}</div>
                    ))}
                  </div>
                );
                return (
                  <Tooltip title={tooltipContent} placement="left">
                    <div
                      style={{
                        maxWidth: '200px',
                        maxHeight: '60px', // Set a fixed height for the cell
                        overflow:'auto',
                        textOverflow: 'ellipsis',
                     
                        cursor: 'pointer',
                      }}
                    >
                      {remarks[remarks.length - 1]}
                    </div>
                  </Tooltip>
                );
              }
              return null;
            }}
          />
        </Table>
      </div>
    </Layout>
  );
};

export default Ast;













