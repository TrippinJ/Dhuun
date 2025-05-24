import React, { useState, useEffect } from 'react';
import API from '../api/api';
import { 
  FaMusic, 
  FaUser, 
  FaDollarSign, 
  FaCalendarAlt,
  FaDownload,
  FaEye,
  FaChartLine
} from 'react-icons/fa';

const SoldBeats = () => {
  const [soldBeats, setSoldBeats] = useState([]);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    thisMonthSales: 0,
    thisMonthRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, month, week

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get(`/api/sales?timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSoldBeats(response.data.sales);
      setSalesStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '18px'
      }}>
        Loading sales data...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: 0, fontSize: '28px', color: '#333' }}>Sales & Analytics</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: '#f8f9fa',
          padding: '25px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            background: '#007bff',
            color: 'white',
            padding: '15px',
            borderRadius: '50%',
            fontSize: '20px'
          }}>
            <FaMusic />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#333' }}>{salesStats.totalSales}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Sales</p>
          </div>
        </div>
        
        <div style={{
          background: '#f8f9fa',
          padding: '25px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            background: '#28a745',
            color: 'white',
            padding: '15px',
            borderRadius: '50%',
            fontSize: '20px'
          }}>
            <FaDollarSign />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Rs {salesStats.totalRevenue.toFixed(2)}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Revenue</p>
          </div>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '25px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            background: '#17a2b8',
            color: 'white',
            padding: '15px',
            borderRadius: '50%',
            fontSize: '20px'
          }}>
            <FaChartLine />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#333' }}>{salesStats.thisMonthSales}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>This Month Sales</p>
          </div>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '25px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{
            background: '#fd7e14',
            color: 'white',
            padding: '15px',
            borderRadius: '50%',
            fontSize: '20px'
          }}>
            <FaDollarSign />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Rs {salesStats.thisMonthRevenue.toFixed(2)}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>This Month Revenue</p>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '22px', color: '#333' }}>Recent Sales</h3>
        {soldBeats.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <FaMusic style={{ fontSize: '48px', marginBottom: '15px', color: '#ccc' }} />
            <p style={{ fontSize: '18px', margin: 0 }}>No sales yet. Keep promoting your beats!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '16px'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #e9ecef' }}>Beat</th>
                  <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #e9ecef' }}>Buyer</th>
                  <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #e9ecef' }}>License</th>
                  <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #e9ecef' }}>Amount</th>
                  <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #e9ecef' }}>Date</th>
                  <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #e9ecef' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {soldBeats.map((sale) => (
                  <tr key={sale._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '15px', border: '1px solid #e9ecef' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={sale.beat.coverImage} 
                          alt={sale.beat.title}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                        />
                        <span>{sale.beat.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px', border: '1px solid #e9ecef' }}>{sale.buyer.name}</td>
                    <td style={{ padding: '15px', border: '1px solid #e9ecef' }}>{sale.license}</td>
                    <td style={{ padding: '15px', border: '1px solid #e9ecef' }}>Rs {sale.amount.toFixed(2)}</td>
                    <td style={{ padding: '15px', border: '1px solid #e9ecef' }}>{new Date(sale.date).toLocaleDateString()}</td>
                    <td style={{ padding: '15px', border: '1px solid #e9ecef' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: sale.status === 'completed' ? '#d4edda' : 
                                   sale.status === 'pending' ? '#fff3cd' : '#f8d7da',
                        color: sale.status === 'completed' ? '#155724' : 
                               sale.status === 'pending' ? '#856404' : '#721c24'
                      }}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoldBeats;