
import React, { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaFileDownload } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminSales.module.css';

const AdminSales = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/api/admin/orders?page=${currentPage}&status=${statusFilter}`
      );
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
      setLoading(false);
      
      // Set fallback demo data
      setOrders([
        {
          _id: 'ord123456',
          user: { name: 'John Doe', email: 'john@example.com' },
          items: [
            { 
              beat: { 
                title: 'Summer Vibes', 
                producer: { name: 'DJ Beats' } 
              }, 
              license: 'Basic', 
              price: 19.99 
            }
          ],
          totalAmount: 19.99,
          paymentStatus: 'Completed',
          createdAt: '2023-10-15T14:32:21.000Z'
        },
        {
          _id: 'ord123457',
          user: { name: 'Jane Smith', email: 'jane@example.com' },
          items: [
            { 
              beat: { 
                title: 'Trap Nation', 
                producer: { name: 'Beat Master' } 
              }, 
              license: 'Premium', 
              price: 49.99 
            },
            { 
              beat: { 
                title: 'Lo-Fi Dreams', 
                producer: { name: 'Chill Maker' } 
              }, 
              license: 'Basic', 
              price: 14.99 
            }
          ],
          totalAmount: 64.98,
          paymentStatus: 'Completed',
          createdAt: '2023-10-10T09:45:13.000Z'
        }
      ]);
      setTotalPages(1);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const exportOrdersCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Items', 'Total', 'Status'];
    const rows = orders.map(order => [
      order._id,
      order.user?.name || 'Unknown',
      order.user?.email || 'Unknown',
      new Date(order.createdAt).toLocaleDateString(),
      order.items.length,
      `Rs ${order.totalAmount.toFixed(2)}`,
      order.paymentStatus
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = searchTerm 
    ? orders.filter(order => 
        order._id.includes(searchTerm) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orders;

  if (loading) {
    return <div className={styles.loading}>Loading orders...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.salesContainer}>
      <div className={styles.salesHeader}>
        <h2>Sales Management</h2>
        <button 
          className={styles.exportButton}
          onClick={exportOrdersCSV}
        >
          <FaFileDownload /> Export CSV
        </button>
      </div>

      <div className={styles.salesControls}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search by order ID, customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <FaSearch />
          </button>
        </form>

        <select 
          value={statusFilter} 
          onChange={handleStatusFilterChange}
          className={styles.filterSelect}
        >
          <option value="all">All Orders</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div className={styles.ordersTable}>
        <div className={styles.tableHeader}>
          <div className={styles.orderIdCell}>Order ID</div>
          <div className={styles.customerCell}>Customer</div>
          <div className={styles.dateCell}>Date</div>
          <div className={styles.itemsCell}>Items</div>
          <div className={styles.totalCell}>Total</div>
          <div className={styles.statusCell}>Status</div>
          <div className={styles.actionsCell}>Actions</div>
        </div>

        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order._id} className={styles.tableRow}>
              <div className={styles.orderIdCell}>
                #{order._id.substring(0, 8)}
              </div>
              
              <div className={styles.customerCell}>
                <div className={styles.customerInfo}>
                  <span className={styles.customerName}>{order.user?.name || 'Unknown'}</span>
                  <span className={styles.customerEmail}>{order.user?.email || 'Unknown'}</span>
                </div>
              </div>
              
              <div className={styles.dateCell}>
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
              
              <div className={styles.itemsCell}>
                {order.items.length} item(s)
              </div>
              
              <div className={styles.totalCell}>
                ${order.totalAmount.toFixed(2)}
              </div>
              
              <div className={styles.statusCell}>
                <span className={`${styles.statusTag} ${styles[order.paymentStatus.toLowerCase()]}`}>
                  {order.paymentStatus}
                </span>
              </div>
              
              <div className={styles.actionsCell}>
                <button 
                  className={styles.actionButton}
                  onClick={() => handleViewOrder(order)}
                  title="View Order Details"
                >
                  <FaEye />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noOrders}>
            <p>No orders found. Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className={styles.pageButton}
        >
          Previous
        </button>
        
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        
        <button 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className={styles.pageButton}
        >
          Next
        </button>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Order Details - #{selectedOrder._id.substring(0, 8)}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowOrderDetails(false)}
              >
                &times;
              </button>
            </div>
            
            <div className={styles.orderInfo}>
              <div className={styles.orderDetail}>
                <span className={styles.detailLabel}>Customer:</span>
                <span className={styles.detailValue}>{selectedOrder.user?.name || 'Unknown'}</span>
              </div>
              
              <div className={styles.orderDetail}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{selectedOrder.user?.email || 'Unknown'}</span>
              </div>
              
              <div className={styles.orderDetail}>
                <span className={styles.detailLabel}>Date:</span>
                <span className={styles.detailValue}>
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className={styles.orderDetail}>
                <span className={styles.detailLabel}>Payment Status:</span>
                <span className={`${styles.statusTag} ${styles[selectedOrder.paymentStatus.toLowerCase()]}`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              
              <div className={styles.orderDetail}>
                <span className={styles.detailLabel}>Payment Method:</span>
                <span className={styles.detailValue}>
                  {selectedOrder.paymentMethod || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className={styles.orderItems}>
              <h4>Purchased Items</h4>
              
              <div className={styles.itemsTable}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemName}>Beat</div>
                  <div className={styles.itemProducer}>Producer</div>
                  <div className={styles.itemLicense}>License</div>
                  <div className={styles.itemPrice}>Price</div>
                </div>
                
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className={styles.itemRow}>
                    <div className={styles.itemName}>
                      {item.beat?.title || 'Unknown Beat'}
                    </div>
                    <div className={styles.itemProducer}>
                      {item.beat?.producer?.name || 'Unknown Producer'}
                    </div>
                    <div className={styles.itemLicense}>
                      {item.license}
                    </div>
                    <div className={styles.itemPrice}>
                      Rs {item.price.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={styles.orderTotal}>
                <span className={styles.totalLabel}>Total:</span>
                <span className={styles.totalValue}>
                  Rs {selectedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.closeModalButton}
                onClick={() => setShowOrderDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSales;