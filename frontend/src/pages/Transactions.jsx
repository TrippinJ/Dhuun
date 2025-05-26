// In frontend/src/pages/Transactions.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaExchangeAlt, FaFilter } from "react-icons/fa";
import API from "../api/api";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import styles from "../css/Transactions.module.css";

const Transactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all");
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        const response = await API.get(`/api/wallet/transactions?page=${currentPage}&filter=${filter}`);
        
        setTransactions(response.data.transactions);
        setTotalPages(response.data.totalPages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to load transactions. Please try again.");
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [currentPage, filter]);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };
  
  // Export transactions to CSV
  const exportTransactions = () => {
    // Create CSV content
    const headers = ["Date", "Type", "Amount", "Description", "Status"];
    const rows = transactions.map(transaction => [
      formatDate(transaction.createdAt),
      transaction.type,
      transaction.amount.toFixed(2),
      transaction.description || "",
      transaction.status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <NavbarBeatExplore />
        <div className={styles.loading}>Loading transactions...</div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <NavbarBeatExplore />
      
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate("/dashboard")}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Transaction History</h1>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <div className={styles.controls}>
        {/* <div className={styles.filterControl}>
          <label>Filter:</label>
          <select value={filter} onChange={handleFilterChange}>
            <option value="all">All Transactions</option>
            <option value="sale">Sales</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="refund">Refunds</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div> */}
        
        <button 
          className={styles.exportButton}
          onClick={exportTransactions}
        >
          <FaDownload /> Export CSV
        </button>
      </div>
      
      {transactions.length > 0 ? (
        <div className={styles.transactionsTable}>
          <div className={styles.tableHeader}>
            <div className={styles.dateColumn}>Date</div>
            <div className={styles.typeColumn}>Type</div>
            <div className={styles.descriptionColumn}>Description</div>
            <div className={styles.statusColumn}>Status</div>
            <div className={styles.amountColumn}>Amount</div>
          </div>
          
          {transactions.map((transaction, index) => (
            <div key={index} className={styles.tableRow}>
              <div className={styles.dateColumn}>
                {formatDate(transaction.createdAt)}
              </div>
              <div className={styles.typeColumn}>
                <span className={`${styles.typeTag} ${styles[transaction.type]}`}>
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </span>
              </div>
              <div className={styles.descriptionColumn}>
                {transaction.description || "-"}
              </div>
              <div className={styles.statusColumn}>
                <span className={`${styles.statusTag} ${styles[transaction.status]}`}>
                  {transaction.status}
                </span>
              </div>
              <div className={`${styles.amountColumn} ${transaction.amount > 0 ? styles.positive : styles.negative}`}>
                {transaction.amount > 0 ? "+" : ""}{transaction.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noTransactions}>
          <div className={styles.emptyIcon}>
            <FaExchangeAlt />
          </div>
          <h3>No transactions found</h3>
          <p>Your transaction history will appear here</p>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => Math.abs(page - currentPage) < 2 || page === 1 || page === totalPages)
              .map((page, index, array) => {
                // Add ellipsis where needed
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className={styles.ellipsis}>...</span>
                      <button
                        className={`${styles.pageNumber} ${currentPage === page ? styles.activePage : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                
                return (
                  <button
                    key={page}
                    className={`${styles.pageNumber} ${currentPage === page ? styles.activePage : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              })}
          </div>
          
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Transactions;