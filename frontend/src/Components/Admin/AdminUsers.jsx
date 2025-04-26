import React, { useState, useEffect } from 'react';
import { FaEdit, FaBan, FaUserShield, FaSearch, FaUserPlus } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminUsers.module.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Create the API request
      let endpoint = `/api/admin/users?page=${currentPage}`;
      
      // Add filter if not 'all'
      if (filter !== 'all') {
        endpoint += `&filter=${filter}`;
      }
      
      const response = await API.get(endpoint);
      
      if (response.data && response.data.users) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error('Invalid response format');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await API.get(`/api/admin/users/search?q=${searchTerm}`);
      
      if (response.data && response.data.users) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages || 1);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    // In a complete implementation, this would open a modal
    // For now, just log the action
    console.log('Edit user:', user);
  };

  const handleToggleBan = async (userId, isBanned) => {
    try {
      const response = await API.patch(`/api/admin/users/${userId}`, {
        isBanned: !isBanned
      });
      
      // Update the user in the list
      if (response.data && response.data.success) {
        setUsers(users.map(user => 
          user._id === userId ? {...user, isBanned: !isBanned} : user
        ));
      }
    } catch (error) {
      console.error('Error banning/unbanning user:', error);
      alert(`Failed to ${isBanned ? 'unban' : 'ban'} user. Please try again.`);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      const response = await API.patch(`/api/admin/users/${userId}`, {
        role: 'admin'
      });
      
      // Update the user in the list
      if (response.data && response.data.success) {
        setUsers(users.map(user => 
          user._id === userId ? {...user, role: 'admin'} : user
        ));
      }
    } catch (error) {
      console.error('Error making user admin:', error);
      alert('Failed to make user an admin. Please try again.');
    }
  };

  // Filter users based on search term (client-side filtering as backup)
  const filteredUsers = searchTerm && filter === 'all' 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  if (loading) {
    return <div className={styles.loading}>Loading users...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.usersContainer}>
      <div className={styles.usersHeader}>
        <h2>User Management</h2>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddUser(true)}
        >
          <FaUserPlus /> Add User
        </button>
      </div>

      <div className={styles.usersControls}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <FaSearch />
          </button>
        </form>

        <select 
          value={filter} 
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="seller">Sellers</option>
          <option value="buyer">Buyers</option>
          <option value="banned">Banned Users</option>
        </select>
      </div>

      <div className={styles.usersTable}>
        <div className={styles.tableHeader}>
          <div className={styles.userCell}>User</div>
          <div className={styles.roleCell}>Role</div>
          <div className={styles.statusCell}>Status</div>
          <div className={styles.joinedCell}>Joined</div>
          <div className={styles.actionsCell}>Actions</div>
        </div>

        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user._id} className={styles.tableRow}>
              <div className={styles.userCell}>
                <div className={styles.userInfo}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className={styles.userAvatar} />
                  ) : (
                    <div className={styles.userInitials}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.roleCell}>
                <span className={`${styles.roleTag} ${styles[user.role]}`}>
                  {user.role}
                </span>
              </div>
              
              <div className={styles.statusCell}>
                <span className={`${styles.statusTag} ${user.isBanned ? styles.banned : styles.active}`}>
                  {user.isBanned ? 'Banned' : 'Active'}
                </span>
              </div>
              
              <div className={styles.joinedCell}>
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
              
              <div className={styles.actionsCell}>
                <button 
                  className={styles.actionButton}
                  onClick={() => handleEdit(user)}
                  title="Edit User"
                >
                  <FaEdit />
                </button>
                
                <button 
                  className={`${styles.actionButton} ${user.isBanned ? styles.unbanned : styles.banned}`}
                  onClick={() => handleToggleBan(user._id, user.isBanned)}
                  title={user.isBanned ? 'Unban User' : 'Ban User'}
                >
                  <FaBan />
                </button>
                
                {user.role !== 'admin' && (
                  <button 
                    className={styles.actionButton}
                    onClick={() => handleMakeAdmin(user._id)}
                    title="Make Admin"
                  >
                    <FaUserShield />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noUsers}>
            <p>No users found. Try adjusting your search or filter.</p>
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
    </div>
  );
};

export default AdminUsers;