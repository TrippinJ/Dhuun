import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaWallet, FaMoneyBillWave, FaExchangeAlt, FaChevronRight } from "react-icons/fa";
import API from "../api/api";
import styles from "../css/SellerWallet.module.css";
import { showToast } from "../utils/toast";

const SellerWallet = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added missing state
  const [successMessage, setSuccessMessage] = useState(""); // Added missing state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        if (!token) {
          showToast.error("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        const response = await API.get("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Wallet data:", response.data);

        if (response.data && response.data.wallet) {
          setWallet(response.data.wallet);
          // Remove this toast as it's too frequent for normal loading
          // showToast.success("Wallet data loaded successfully");
        } else {
          throw new Error("Invalid wallet data format");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching wallet:", error);
        setError("Failed to load wallet information. Please try again.");
        showToast.error("Failed to load wallet information. Please try again.");
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  // Handle withdraw request
  const handleWithdraw = async (e) => {
    e.preventDefault();

    // Validate amount
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (amount > wallet.balance) {
      showToast.error(`Insufficient balance. Available: Rs ${wallet.balance ? wallet.balance.toFixed(2) : '0.00'}`);
      return;
    }

    try {
      setWithdrawLoading(true);
      setError(null); // Fixed: was showToast.error(null)

      const token = localStorage.getItem("token");
      if (!token) {
        showToast.error("Authentication required. Please log in.");
        setWithdrawLoading(false);
        return;
      }

      const response = await API.post("/api/wallet/withdraw", {
        amount,
        paymentMethod: withdrawMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast.success(`Withdrawal request of Rs ${amount.toFixed(2)} submitted successfully!`);
      setWithdrawAmount("");
      setSuccessMessage(`Withdrawal request submitted successfully!`);

      // Refresh wallet data after successful withdrawal request
      const walletResponse = await API.get("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (walletResponse.data && walletResponse.data.wallet) {
        setWallet(walletResponse.data.wallet);
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit withdrawal request";
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs ${(amount || 0).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter out duplicate transactions
  const getUniqueTransactions = (transactions) => {
    if (!Array.isArray(transactions)) return [];
    
    // Create a Map using transaction description and date as composite key
    const uniqueTransactionsMap = new Map();

    transactions.forEach(transaction => {
      const key = `${transaction.description}-${transaction.createdAt}-${transaction.amount}`;
      if (!uniqueTransactionsMap.has(key)) {
        uniqueTransactionsMap.set(key, transaction);
      }
    });

    // Convert map values back to array and return
    return Array.from(uniqueTransactionsMap.values());
  };

  if (loading) {
    return (
      <div className={styles.walletContainer}>
        <div className={styles.loading}>Loading wallet...</div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className={styles.walletContainer}>
        <div className={styles.error}>Wallet information not available</div>
      </div>
    );
  }

  // Get unique transactions for display
  const uniqueTransactions = wallet.transactions ?
    getUniqueTransactions(wallet.transactions) : [];

  return (
    <div className={styles.walletContainer}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

      <div className={styles.balanceCards}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceIcon}>
            <FaWallet />
          </div>
          <div className={styles.balanceInfo}>
            <h3>Available Balance</h3>
            <div className={styles.balanceAmount}>
              Rs {wallet.balance ? wallet.balance.toFixed(2) : '0.00'}
            </div>
            <div className={styles.balanceNote}>Ready to withdraw</div>
          </div>
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceIcon}>
            <FaMoneyBillWave />
          </div>
          <div className={styles.balanceInfo}>
            <h3>Pending Balance</h3>
            <div className={styles.balanceAmount}>
              Rs {wallet.pendingBalance ? wallet.pendingBalance.toFixed(2) : '0.00'}
            </div>
            <div className={styles.balanceNote}>Processing payments</div>
          </div>
        </div>
      </div>

      <div className={styles.walletSections}>
        <div className={styles.withdrawSection}>
          <h3>Withdraw Funds</h3>
          <form onSubmit={handleWithdraw} className={styles.withdrawForm}>
            <div className={styles.formGroup}>
              <label>Amount (Rs)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                min="1"
                step="0.01"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Payment Method</label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                required
              >
                <option value="khalti">Khalti</option>
                <option value="bank">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                
              </select>
            </div>

            <button
              type="submit"
              className={styles.withdrawButton}
              disabled={withdrawLoading || (wallet.balance || 0) <= 0}
            >
              {withdrawLoading ? "Processing..." : "Request Withdrawal"}
            </button>
          </form>
        </div>

        <div className={styles.transactionsSection}>
          <div className={styles.sectionHeader}>
            <h3>Recent Transactions</h3>
            <button
              className={styles.viewAllButton}
              onClick={() => navigate("/transactions")}
            >
              View All <FaChevronRight />
            </button>
          </div>

          {uniqueTransactions.length > 0 ? (
            <div className={styles.transactionsList}>
              {uniqueTransactions.map((transaction, index) => (
                <div 
                  key={`${transaction.description}-${transaction.createdAt}-${index}`} 
                  className={styles.transactionItem}
                >
                  <div className={styles.transactionIcon}>
                    <FaExchangeAlt />
                  </div>
                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionDescription}>
                      {transaction.description || `${transaction.type?.charAt(0).toUpperCase() + transaction.type?.slice(1)}`}
                    </div>
                    <div className={styles.transactionMeta}>
                      <span className={styles.transactionDate}>
                        {formatDate(transaction.createdAt)}
                      </span>
                      <span className={`${styles.transactionStatus} ${styles[transaction.status]}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                  <div className={`${styles.transactionAmount} ${transaction.amount > 0 ? styles.positive : styles.negative}`}>
                    {transaction.amount > 0 ? "+" : ""}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noTransactions}>
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerWallet;