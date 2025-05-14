import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../components/AdminNav';

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
      const res = await fetch(`/api/session/${sessionId}/teams`);
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
      const res = await fetch(`/api/session/${sessionId}/votes`);
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
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setAdminUsers(data.admins || []);
      }
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data.logs || []);
      }
    } catch {}
  };

  return (
    <div className="mongodb-theme">
      <h2>Admin Dashboard</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {loading && <div>Loading...</div>}
      <div style={{ display: 'flex', gap: 32 }}>
        {/* Session List */}
        <div style={{ flex: 1 }}>
          <h3>Sessions</h3>
          <ul>
            {sessions.map(session => (
              <li key={session._id}>
                <button onClick={() => fetchSessionDetails(session._id)}>
                  {session.title || session._id} ({session.isActive ? 'Active' : session.resultsPublished ? 'Completed' : 'Upcoming'})
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Session Details */}
        <div style={{ flex: 2 }}>
          {selectedSession && (
            <>
              <h3>Session Details</h3>
              <button onClick={() => fetchVotingStats(selectedSession)}>Show Voting Stats</button>
              <h4>Teams & Submissions</h4>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Product Title</th>
                    <th>Submitted At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(team => (
                    <tr key={team._id}>
                      <td>{team.teamName}</td>
                      <td>{team.productTitle}</td>
                      <td>{team.submittedAt ? new Date(team.submittedAt).toLocaleString() : '-'}</td>
                      <td>
                        {/* Optionally add edit/delete buttons here */}
                        <button disabled>Edit</button>
                        <button disabled>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Voting Stats */}
              {votingStats.length > 0 && (
                <div>
                  <h4>Voting Progress</h4>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Votes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {votingStats.map(stat => (
                        <tr key={stat.teamId}>
                          <td>{stat.teamName}</td>
                          <td>{stat.votes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
        {/* Admin Users & Audit */}
        <div style={{ flex: 1 }}>
          <h3>Admin Users</h3>
          <ul>
            {adminUsers.map(admin => (
              <li key={admin._id}>{admin.username}</li>
            ))}
          </ul>
          <h3>Audit Log</h3>
          <ul style={{ maxHeight: 150, overflowY: 'auto' }}>
            {auditLogs.map(log => (
              <li key={log._id}>
                [{new Date(log.timestamp).toLocaleString()}] {log.action} by {log.user}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
