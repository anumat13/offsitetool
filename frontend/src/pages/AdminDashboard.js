import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../components/AdminNav';

// CSS for animations and responsive design
const styles = {
  fadeIn: {
    animation: 'fadeIn 0.5s ease-in-out',
  },
  cardHover: {
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    }
  },
  statCard: {
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  },
  actionButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s ease',
    fontWeight: '500',
  }
};

function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [votingStats, setVotingStats] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admin Dashboard';
    fetchSessions();
    fetchAdminUsers();
    fetchAuditLogs();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/admin/sessions/all`);
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions || []);
      } else {
        setError(data.message || 'Could not fetch sessions');
      }
    } catch (err) {
      setError('Could not connect to backend');
    }
    setLoading(false);
  };

  const fetchSessionDetails = async (sessionId) => {
    setLoading(true);
    setSelectedSession(sessionId);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}/teams`);
      const data = await res.json();
      if (res.ok) {
        setTeams(data.teams || []);
        setSubmissions(data.teams || []);
      } else {
        setError(data.message || 'Could not fetch teams');
      }
    } catch (err) {
      setError('Could not connect to backend');
    }
    setLoading(false);
  };

  const fetchVotingStats = async (sessionId) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}/votes`);
      const data = await res.json();
      if (res.ok) {
        setVotingStats(data.stats || []);
      } else {
        setError(data.message || 'Could not fetch voting stats');
      }
    } catch (err) {
      setError('Could not connect to backend');
    }
    setLoading(false);
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/admin/users`);
      const data = await res.json();
      if (res.ok) {
        setAdminUsers(data.admins || []);
      }
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/admin/audit`);
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data.logs || []);
      }
    } catch {}
  };

  return (
    <div className="mongodb-theme" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="mongodb-card" style={{ 
        padding: '24px', 
        borderRadius: '12px', 
        boxShadow: '0 6px 12px rgba(0,0,0,0.1)', 
        marginBottom: '20px',
        background: 'linear-gradient(to right, #ffffff, #f8f9fa)'
      }}>
        <h2 className="mdb-header-2" style={{ 
          textAlign: 'center', 
          marginBottom: '24px', 
          color: 'var(--mdb-primary-color)',
          fontSize: '2rem',
          fontWeight: 'bold',
          borderBottom: '2px solid var(--mdb-primary-color-light)',
          paddingBottom: '12px'
        }}>Admin Dashboard</h2>
        
        {error && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '12px', 
            backgroundColor: 'var(--mdb-danger-color-light)', 
            borderRadius: '8px',
            color: 'var(--mdb-danger-color-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
        
        {loading && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px'
          }}>
            <div className="mdb-spinner"></div>
            <span style={{ marginLeft: '10px' }}>Loading...</span>
          </div>
        )}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {/* Summary Statistics - Visible on all screen sizes */}
          <div className="summary-stats" style={{ 
            gridColumn: '1 / -1', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px',
            ...styles.fadeIn
          }}>
            <div style={{ 
              ...styles.statCard,
              backgroundColor: 'var(--mdb-primary-color-light)', 
              boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
              border: '1px solid var(--mdb-primary-color-light)',
              transform: 'translateY(0px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '1rem', color: 'var(--mdb-primary-color-dark)', marginBottom: '8px' }}>
                <i className="fas fa-calendar-alt" style={{ marginRight: '8px' }}></i>
                Total Sessions
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--mdb-primary-color)' }}>
                {sessions.length}
              </div>
            </div>
            
            <div style={{ 
              ...styles.statCard,
              backgroundColor: 'var(--mdb-success-color-light)', 
              boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
              border: '1px solid var(--mdb-success-color-light)',
              transform: 'translateY(0px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '1rem', color: 'var(--mdb-success-color-dark)', marginBottom: '8px' }}>
                <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                Active Teams
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--mdb-success-color)' }}>
                {selectedSession ? submissions.length : '—'}
              </div>
            </div>
            
            <div style={{ 
              ...styles.statCard,
              backgroundColor: 'var(--mdb-info-color-light)', 
              boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
              border: '1px solid var(--mdb-info-color-light)',
              transform: 'translateY(0px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '1rem', color: 'var(--mdb-info-color-dark)', marginBottom: '8px' }}>
                <i className="fas fa-vote-yea" style={{ marginRight: '8px' }}></i>
                Total Votes
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--mdb-info-color)' }}>
                {votingStats.reduce((sum, stat) => sum + (stat.votes || 0), 0)}
              </div>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Session List */}
          <div className="sessions-panel" style={{ 
            padding: '20px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid var(--mdb-border-color)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
            height: 'fit-content',
            ...styles.fadeIn
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              color: 'var(--mdb-primary-color)', 
              marginBottom: '16px', 
              borderBottom: '1px solid var(--mdb-border-color)', 
              paddingBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-list"></i>
              Sessions
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--mdb-text-color-light)', marginBottom: '8px' }}>
                Select a session to view details:
              </div>
            </div>
            
            <div className="session-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {sessions.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--mdb-text-color-light)' }}>
                  No sessions found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sessions.map(session => (
                    <button 
                      key={session._id}
                      onClick={() => fetchSessionDetails(session._id)}
                      style={{ 
                        padding: '12px', 
                        textAlign: 'left',
                        border: selectedSession === session._id ? 
                          '2px solid var(--mdb-primary-color)' : 
                          '1px solid var(--mdb-border-color)',
                        borderRadius: '8px',
                        backgroundColor: selectedSession === session._id ? 
                          'var(--mdb-primary-color-light)' : 
                          'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        boxShadow: selectedSession === session._id ?
                          '0 4px 8px rgba(0,0,0,0.1)' :
                          '0 2px 4px rgba(0,0,0,0.05)',
                        transform: selectedSession === session._id ?
                          'translateY(-2px)' :
                          'none'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        {session.title || session.sessionName || session._id}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '12px', 
                          backgroundColor: session.isActive ? 
                            'var(--mdb-success-color-light)' : 
                            session.resultsPublished ? 
                              'var(--mdb-warning-color-light)' : 
                              'var(--mdb-info-color-light)',
                          color: session.isActive ? 
                            'var(--mdb-success-color-dark)' : 
                            session.resultsPublished ? 
                              'var(--mdb-warning-color-dark)' : 
                              'var(--mdb-info-color-dark)',
                          fontSize: '0.75rem'
                        }}>
                          {session.isActive ? 'Active' : session.resultsPublished ? 'Completed' : 'Upcoming'}
                        </span>
                        <span style={{ color: 'var(--mdb-text-color-light)', fontSize: '0.75rem' }}>
                          Created: {new Date(session.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Session Details */}
          <div className="details-panel" style={{ 
            padding: '20px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid var(--mdb-border-color)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
            ...styles.fadeIn
          }}>
            {selectedSession ? (
              <>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  color: 'var(--mdb-primary-color)', 
                  marginBottom: '16px', 
                  borderBottom: '2px solid var(--mdb-primary-color-light)', 
                  paddingBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 'bold'
                }}>
                  <i className="fas fa-info-circle"></i>
                  Session Details
                </h3>
                
                {/* Session Stats */}
                <div className="session-stats" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--mdb-primary-color-light)', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                    border: '1px solid var(--mdb-primary-color-light)',
                    transition: 'transform 0.3s ease',
                    ':hover': {
                      transform: 'translateY(-3px)'
                    }
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--mdb-primary-color-dark)' }}>Teams</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--mdb-primary-color)' }}>
                      {submissions.length}
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--mdb-success-color-light)', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                    border: '1px solid var(--mdb-success-color-light)',
                    transition: 'transform 0.3s ease',
                    ':hover': {
                      transform: 'translateY(-3px)'
                    }
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--mdb-success-color-dark)' }}>Submissions</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--mdb-success-color)' }}>
                      {submissions.filter(team => team.submittedAt).length}
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--mdb-info-color-light)', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                    border: '1px solid var(--mdb-info-color-light)',
                    transition: 'transform 0.3s ease',
                    ':hover': {
                      transform: 'translateY(-3px)'
                    }
                  }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--mdb-info-color-dark)' }}>Votes Cast</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--mdb-info-color)' }}>
                      {votingStats.reduce((sum, stat) => sum + (stat.votes || 0), 0)}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0 }}>Teams & Submissions</h4>
                  <button 
                    onClick={() => fetchVotingStats(selectedSession)}
                    style={{ 
                      padding: '8px 14px', 
                      backgroundColor: 'var(--mdb-primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      ':hover': {
                        backgroundColor: 'var(--mdb-primary-color-dark)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <i className="fas fa-chart-bar"></i>
                    Show Voting Stats
                  </button>
                </div>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--mdb-primary-color-light)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--mdb-primary-color)', fontWeight: '600' }}>Team Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--mdb-primary-color)', fontWeight: '600' }}>Product Title</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--mdb-primary-color)', fontWeight: '600' }}>Submitted At</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--mdb-primary-color)', fontWeight: '600' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--mdb-text-color-light)' }}>
                            No teams found for this session
                          </td>
                        </tr>
                      ) : (
                        submissions.map(team => (
                          <tr key={team._id} style={{ borderBottom: '1px solid var(--mdb-border-color)' }}>
                            <td style={{ padding: '8px' }}>{team.teamName}</td>
                            <td style={{ padding: '8px' }}>{team.productTitle}</td>
                            <td style={{ padding: '8px' }}>
                              {team.submittedAt ? 
                                new Date(team.submittedAt).toLocaleString() : 
                                <span style={{ color: 'var(--mdb-text-color-light)' }}>Not submitted</span>
                              }
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button 
                                  title="View Details"
                                  style={{ 
                                    padding: '6px 10px', 
                                    backgroundColor: 'var(--mdb-info-color-light)',
                                    color: 'var(--mdb-info-color)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    ':hover': {
                                      backgroundColor: 'var(--mdb-info-color)',
                                      color: 'white'
                                    }
                                  }}
                                  onClick={() => alert(`View details for ${team.teamName}`)}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  title="Edit Team"
                                  style={{ 
                                    padding: '6px 10px', 
                                    backgroundColor: 'var(--mdb-warning-color-light)',
                                    color: 'var(--mdb-warning-color)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    ':hover': {
                                      backgroundColor: 'var(--mdb-warning-color)',
                                      color: 'white'
                                    }
                                  }}
                                  onClick={() => alert(`Edit ${team.teamName}`)}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Voting Stats */}
                {votingStats.length > 0 && (
                  <div>
                    <h4 style={{ 
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="fas fa-chart-bar"></i>
                      Voting Progress
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--mdb-info-color-light)' }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid var(--mdb-info-color)' }}>Team</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '2px solid var(--mdb-info-color)' }}>Votes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {votingStats.map(stat => (
                          <tr key={stat.teamId} style={{ borderBottom: '1px solid var(--mdb-border-color)' }}>
                            <td style={{ padding: '8px' }}>{stat.teamName}</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{stat.votes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                color: 'var(--mdb-text-color-light)',
                padding: '40px 0'
              }}>
                <i className="fas fa-info-circle" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
                <p>Select a session from the list to view details</p>
              </div>
            )}
          </div>
          
          {/* Admin Users & Audit */}
          <div className="admin-panel" style={{ 
            padding: '20px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid var(--mdb-border-color)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
            height: 'fit-content',
            ...styles.fadeIn
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              color: 'var(--mdb-primary-color)', 
              marginBottom: '16px', 
              borderBottom: '1px solid var(--mdb-border-color)', 
              paddingBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-user-shield"></i>
              Admin Users
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              {adminUsers.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--mdb-text-color-light)' }}>
                  No admin users found
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {adminUsers.map(admin => (
                    <div 
                      key={admin._id}
                      style={{ 
                        padding: '10px 14px', 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid var(--mdb-border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                        ':hover': {
                          borderColor: 'var(--mdb-primary-color-light)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <i className="fas fa-user" style={{ color: 'var(--mdb-primary-color)' }}></i>
                      <span>{admin.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <h3 style={{ 
              fontSize: '1.2rem', 
              color: 'var(--mdb-primary-color)', 
              marginBottom: '16px', 
              borderBottom: '1px solid var(--mdb-border-color)', 
              paddingBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-history"></i>
              Audit Log
            </h3>
            
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid var(--mdb-border-color)',
              borderRadius: '8px',
              backgroundColor: 'white',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {auditLogs.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--mdb-text-color-light)' }}>
                  No audit logs found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {auditLogs.map(log => (
                    <div 
                      key={log._id}
                      style={{ 
                        padding: '10px 14px', 
                        borderBottom: '1px solid var(--mdb-border-color)',
                        fontSize: '0.9rem',
                        transition: 'background-color 0.2s ease',
                        ':hover': {
                          backgroundColor: 'var(--mdb-background-color-light)'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--mdb-primary-color)' }}>{log.action}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--mdb-text-color-light)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>by {log.user}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
