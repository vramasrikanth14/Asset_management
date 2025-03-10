
import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import { Space, Table, Button, Modal, Checkbox, message, Tooltip } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { server } from '../constant';
import { Input } from 'antd';
import { parse } from 'path-browserify';

const { Column } = Table;
const { Search } = Input;




const renderProgressLevels = (text, record) => {
  const levels = ['level1', 'level2', 'level3'];
  let selectedLevelIndex = levels.indexOf(record.ProgressLevel);
//  console.log(record.ProgressLevel)
  if (selectedLevelIndex > 0) {
    selectedLevelIndex -= 1;
  }

  let color = 'white'; // Default color for pending

  // Check if the record is approved
  if (record.status === 'Approved' ) {
    color = '#62bf62'; // Green color for approved
  } 
 
else if (record.status === 'Approved'  && record.ProgressLevel ==='level2') {
  color = '#62bf62'; 
}
  else if (record.status === 'Rejected') {
    color = 'red'; // Red color for rejected
  }

  const tooltipContent =( record.status === 'Approved' || record.ProgressLevel === 'level2' )
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


const InboxPage = (darkMode) => {
  const [data, setData] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [remarks, setRemarks] = useState('');


  const [approvedRowsRole2, setApprovedRowsRole2] = useState(() => {
    const storedRows = localStorage.getItem('approvedRowsRole2');
    return storedRows ? JSON.parse(storedRows) : [];
  }); // IDs of rows approved by role2

  const navigate = useNavigate();
  const [filteredStatus, setFilteredStatus] = useState(null);




  const getFilteredData = (filteredStatus) => {
    const role = JSON.parse(localStorage.getItem('role'));
    console.log(role);
    
    if (!filteredStatus) {
      return data.filter((item) => {
        console.log(item);
        // Add conditions to filter out approved or rejected assets
        if (role === 'role1' ) {
          if ((item.status === 'Pending' || item.status !== 'Delivered') && item.payment !== 'true' && item.status !== 'Rejected' && item.ProgressLevel !== 'level3') {
            return true;
          }
        }else if (role === 'role2') {
          if ((item.status === 'Pending' && item.ProgressLevel === 'level1') && item.status !== 'Approved' && item.status !== 'Rejected') {
            return true;
          }
        }  else if (role === 'role3') {
          if (item.status === 'Pending' && item.ProgressLevel === 'level2' && item.status !== 'Approved' && item.status !== 'Rejected') {
            return true;
          }
        }
        return false;
      });
    } else {
      return data.filter((item) => item.status === filteredStatus);
    }
  };
  
  
  const handleSearch = (value) => {
    setFilteredStatus(value);
  };

  useEffect(() => {
    fetchData();
    setUserRole(getUserRoleFromAuth());
  }, []);

  useEffect(() => {
    localStorage.setItem('approvedRowsRole2', JSON.stringify(approvedRowsRole2));
    
  }, [approvedRowsRole2]);

  const fetchData = async () => {
    try {
      const response = await fetch(`${server}/getData`);
      const result = await response.json();
      setData(result.assets);
      console.log(result.assets)
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };



 
  const handleApprove = (record) => {
    setSelectedAsset(record);
    setIsApproveModalVisible(true);
  };

  const handleReject = (record) => {
    setSelectedAsset(record);
    
    setIsRejectModalVisible(true);
  };

  const handleModify = (record) => {
    navigate("/ModifyPage", { state: { record } });
  };

 

  const handleApproveModalOk = async () => {
    try {
      setIsApproveModalVisible(false);
  
      const userRole = getUserRoleFromAuth();
      const status = userRole === "role2" ? "Approved" : "Approved";
      const approvedBy = getUserNameFromAuth();
      const approvedDate = new Date().toISOString();
      let progressLevel = "";
  
      // Set progress level based on user role
      if (userRole === "role2") {
        progressLevel = "level2";
        setApprovedRowsRole2([...approvedRowsRole2, selectedAsset._id]);
      } else {
        progressLevel = "level1";
      }
  
      // Update asset status and details
      const response = await fetch(`${server}/approveAsset/${selectedAsset._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, approvedBy, approvedDate }),
      });
  
      const result = await response.json();
      message.success("Asset approved successfully");
  
      // If user is role2 or role3, update progress level
      if (userRole === 'role2' || userRole === 'role3') {
        const updateProgressResponse = await fetch(`${server}/updateProgressLevel/${selectedAsset._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ progressLevel }),
        });
  
        const updateProgressResult = await updateProgressResponse.json();
        console.log(updateProgressResult.message);
      }
  
      // Remove the selected asset from the table
      const updatedData = data.filter(item => item._id !== selectedAsset._id);
      setData(updatedData); // Update data state
      setSelectedAsset(null); // Reset selectedAsset after successful action
      setFilteredStatus(null); // Reset filtered status
    } catch (error) {
      console.error("Error approving asset:", error);
    }
  };
  
  const handleRejectModalOk = async () => {
    try {
      if (!remarks) {
        message.error('Please mention the remark');
        return;
      }
  
      setIsRejectModalVisible(false);
  
      const rejectedBy = getUserNameFromAuth();
      const rejectedDate = new Date().toISOString();
  
      // Update asset status to Rejected and add remarks
      const response = await fetch(`${server}/rejectAsset/${selectedAsset._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks, rejectedBy, rejectedDate }),
      });
  
      const result = await response.json();
      message.error("Asset rejected successfully");
  
      // Remove the selected asset from the table
      const updatedData = data.filter(item => item._id !== selectedAsset._id);
      setData(updatedData); // Update data state
      setSelectedAsset(null); // Reset selectedAsset after successful action
      setRemarks(''); // Reset remarks after successful rejection
      setFilteredStatus(null); // Reset filtered status
    } catch (error) {
      console.error("Error rejecting asset:", error);
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
      message.success("Successfully delivered");
      console.log(result.message);

      fetchData();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const areLevelsOneTwoAndThreeGreen = (record) => {
    const levels = ["level1", "level2", "level3"];
    let selectedLevelIndex = levels.indexOf(record.ProgressLevel);

    // Check if the last completed level is 2
    return selectedLevelIndex >= 1;
  };

  const isRowApprovedByRole2 = (record) => {
    // Check if the row is approved by role2
    return approvedRowsRole2.includes(record._id);
  };

  

  const filteredData = getFilteredData(); 


 


   
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

  // const filteredPaginationConfig = {
  //   pageSize: 4,
  //   showSizeChanger: false,
  //   showQuickJumper: false,
  //   total: filteredData.length,
  //   showTotal: (total, range) => {
  //     if (filteredData.length > 0) {
  //       return `Showing ${range[0]} to ${range[1]} of ${total} items`;
  //     } else {
  //       return '';
  //     }
  //   },
  // };

  // const paginationConfig = {
  //   pageSize: 4,
  //   showSizeChanger: false,
  //   showQuickJumper: false,
  //   total: filteredData.length,
  //   showTotal: (total, range) => {
  //     if (filteredData.length > 0) {
  //       return (
  //         <span style={{ color: darkMode ? 'white' : 'black' }}>
  //           Showing {range[0]} to {range[1]} of {total} items
  //         </span>
  //       );
  //     } else {
  //       return '';
  //     }
  //   },
  // };
  

  const handleStatusFilter = (status) => {
    setFilteredStatus(status);
  };

  return (
    <Layout>
      <h1>Inbox Page</h1>
      
      <div style={{ flex: '1', width: '100%' }}>
       

        {filteredData.length > 0 ? (
          <Table dataSource={filteredData} pagination={paginationConfig}>
            <Column title="Asset Type" dataIndex="assetType" key="assetType" />
            <Column title="Quantity" dataIndex="Quantity" key="Quantity" />
            <Column title="Unit Price" dataIndex="unitPrice" key="unitPrice" />
            <Column title="Total Price" dataIndex="totalPrice" key="totalPrice" />
            <Column title="Total Price with GST" dataIndex="totalPriceWithGST" key="totalPriceWithGST" />
            <Column title="Status" dataIndex="status" key="status" />

            <Column title="Progress Level" dataIndex="ProgressLevel" key="ProgressLevel" render={renderProgressLevels} />
            <Column
              title="Payment"
              key="payment"
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
            <Column title="Created By" dataIndex="CreatedBy" key="CreatedBy" />
            <Column title="Created Date" dataIndex="CreatedDate" key="CreatedDate" />
            <Column
              title="Action"
              key="action"
              render={(_, record) => (
                <Space size="middle">
                  {(userRole === 'role1') ? (
                    <Button
                      type="primary"
                      style={{ backgroundColor: 'blue', width: '50px', height: '40px' }}
                      onClick={() => handlePaymentChange(record)}
                      disabled={record.status === 'Delivered' || !areLevelsOneTwoAndThreeGreen(record) || record.status ==="Rejected" || record.status === "Pending" }
                    >
                      D
                    </Button>
                  ) : ''}
                  {(userRole === 'role2' || userRole === 'role3') ? (
                    <>
                      <Button
                        type="primary"
                        style={{ backgroundColor: 'green', width: '50px', height: '40px' }}
                        onClick={() => handleApprove(record)}
                        disabled={isRowApprovedByRole2(record) || record.status === 'Rejected' || (record.ProgressLevel === "level2" && userRole === "role2") || record.status ==="Approved" }
                      >
                        A
                      </Button>

                      <Button
                        type="primary"
                        style={{ backgroundColor: 'red', width: '50px', height: '40px' }}
                        onClick={() => handleReject(record)}
                        disabled={isRowApprovedByRole2(record) || record.status === 'Rejected' || (record.ProgressLevel === "level2" && userRole === "role2") || record.status ==="Approved"  }
                      >
                        R
                      </Button>
                      <Button
                        type="primary"
                        style={{ backgroundColor: 'blue', width: '50px', height: '40px' }}
                        onClick={() => handleModify(record)}
                        disabled={isRowApprovedByRole2(record) || record.status === 'Rejected' || (record.ProgressLevel === "level2" && userRole === "role2") || record.status ==="Approved" }
                      >
                        M
                      </Button>
                    </>
                  ) : ''}
                </Space>
              )}
            />
          </Table>
        ) : (
          <p>No data available for the selected status.</p>
        )}
      </div>

      <Modal
        title="Confirm Approval"
        visible={isApproveModalVisible}
        onOk={handleApproveModalOk}
        onCancel={() => setIsApproveModalVisible(false)}
      >
        <p>Are you sure you want to approve this asset?</p>
      </Modal>

      {/* <Modal
        title="Confirm Rejection"
        visible={isRejectModalVisible}
        onOk={handleRejectModalOk}
        onCancel={() => setIsRejectModalVisible(false)}
      >
        <p>Are you sure you want to reject this asset?</p>
      </Modal> */}
<Modal
  title="Confirm Rejection"
  visible={isRejectModalVisible}
  onOk={handleRejectModalOk}
  onCancel={() => setIsRejectModalVisible(false)}
>
  <p>Are you sure you want to reject this asset?</p>
  <h5>Remarks:</h5>
  <Input
    placeholder="Enter remarks"
    value={remarks}
    onChange={(e) => setRemarks(e.target.value)}
  />
</Modal>


    </Layout>
  );
};

function getUserRoleFromAuth() {
  const loggedInUserRole = JSON.parse(localStorage.getItem('role'));
  return loggedInUserRole;
}
function getUserNameFromAuth(){
  const userName = JSON.parse(localStorage.getItem('name'));
  return userName;
}

export default InboxPage;

























