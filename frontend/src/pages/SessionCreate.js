import React, { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';
import { Link } from 'react-router-dom';



function SessionCreate() {
  useEffect(() => { document.title = 'Admin: Session Management'; }, []);
  const [sessionName, setSessionName] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [recentSessions, setRecentSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);

  // Fetch sessions on mount and after changes
  const fetchSessions = () => {
    fetch('/api/admin/sessions/recent')
      .then(res => res.json())
      .then(data => setRecentSessions(data.sessions || []))
      .catch(() => setRecentSessions([]));
    fetch('/api/admin/sessions/all')
      .then(res => res.json())
      .then(data => {
        setAllSessions(data.sessions || []);
        // Automatically set sessionInfo to the single active session if present
        const active = (data.sessions || []).find(s => s.isActive !== false);
        setSessionInfo(active || null);
      })
      .catch(() => setAllSessions([]));
  };
  React.useEffect(fetchSessions, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You must be logged in as admin.');
      return;
    }
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({ sessionName }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Session created: ' + data.session.sessionName + '\nSession ID: ' + data.session._id);
        fetchSessionInfo(data.session._id);
        setSessionName('');
      } else {
        setMessage(data.message || 'Session creation failed');
      }
    } catch (err) {
      setMessage('Could not connect to backend');
    }
  };

  // Fetch session info by ID
  const fetchSessionInfo = async (id) => {
    try {
      const res = await fetch(`/api/session/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSessionInfo(data.session);
      } else {
        setSessionInfo(null);
      }
    } catch {
      setSessionInfo(null);
    }
  };



  // Voting and results controls
  const updateVoting = async (votingOpen) => {
    if (!sessionInfo || !sessionInfo._id) return;
    setMessage('');
    try {
      const res = await fetch(`/api/admin/session/${sessionInfo._id}/voting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingOpen }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchSessionInfo(sessionInfo._id);
      } else {
        setMessage(data.message || 'Failed to update voting status');
      }
    } catch {
      setMessage('Could not connect to backend');
    }
  };
  const updateResults = async (resultsPublished) => {
    if (!sessionInfo || !sessionInfo._id) return;
    setMessage('');
    try {
      const res = await fetch(`/api/admin/session/${sessionInfo._id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultsPublished }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchSessionInfo(sessionInfo._id);
      } else {
        setMessage(data.message || 'Failed to update results status');
      }
    } catch {
      setMessage('Could not connect to backend');
    }
  };

  return (
    <div className="mongodb-theme">
      <AdminNav />
      <img src="/logo.png" alt="App Logo" className="mongodb-logo" />
      <div className="mongodb-card mdb-center">
        <form onSubmit={handleSubmit} style={{ marginBottom: 24, textAlign: 'center' }}>
          <input
            type="text"
            placeholder="Session Name"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            required
            style={{ padding: '8px', borderRadius: 5, border: '1px solid #ccc', marginRight: 8, minWidth: 180 }}
          />
          <button type="submit" style={{ padding: '8px 20px', borderRadius: 5, background: '#13aa52', color: 'white', border: 'none' }}>
            Create Session
          </button>
        </form>
        {message && <div style={{ color: '#c0392b', marginBottom: 16, textAlign: 'center' }}>{message}</div>}

        <h3 style={{ textAlign: 'center' }}>Active Sessions</h3>
        <ul style={{ padding: 0, listStyle: 'none', textAlign: 'center' }}>
          {recentSessions.length === 0 && <li>No active sessions.</li>}
          {recentSessions.map(s => (
            <li key={s._id}>
              <b>{s.sessionName}</b> (ID: <span style={{ fontFamily: 'monospace' }}>{s._id}</span>)
            </li>
          ))}
        </ul>
        <h4 style={{ marginTop: 32, textAlign: 'center' }}>All Sessions</h4>
        <ul style={{ padding: 0, listStyle: 'none', textAlign: 'center' }}>
          {allSessions.length === 0 && <li>No sessions found.</li>}
          {allSessions.map(s => (
            <li key={s._id}>
              <b>{s.sessionName}</b> (ID: <span style={{ fontFamily: 'monospace' }}>{s._id}</span>)
              <span style={{ marginLeft: 8, color: s.isActive !== false ? 'green' : 'gray' }}>
                {s.isActive !== false ? 'Active' : 'Ended'}
              </span>
            </li>
          ))}
        </ul>
        {sessionInfo && (
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <div><b>Session Name:</b> {sessionInfo.sessionName}</div>
            <div><b>Session ID:</b> {sessionInfo._id}</div>
            <div><b>Voting:</b> {sessionInfo.votingOpen ? 'Open' : 'Closed'} <button onClick={() => updateVoting(!sessionInfo.votingOpen)}>{sessionInfo.votingOpen ? 'Close' : 'Open'} Voting</button></div>
            <div><b>Results:</b> {sessionInfo.resultsPublished ? 'Published' : 'Unpublished'} <button onClick={() => updateResults(!sessionInfo.resultsPublished)}>{sessionInfo.resultsPublished ? 'Unpublish' : 'Publish'} Results</button></div>
            <div style={{ marginTop: 12, display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button style={{ background: '#e74c3c', color: 'white', padding: '6px 18px', border: 'none', borderRadius: 5 }} onClick={async () => {
                if (!window.confirm('Are you sure you want to end this session? This will mark session as ended but not delete any data.')) return;
                const token = localStorage.getItem('token');
                if (!token) { setMessage('You must be logged in as admin.'); return; }
                try {
                  const res = await fetch(`/api/admin/session/${sessionInfo._id}/end`, {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Bearer ' + token }
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setMessage('Session ended.');
                    setSessionInfo(null);
                    fetchSessions();
                  } else {
                    setMessage(data.message || 'Failed to end session');
                  }
                } catch {
                  setMessage('Could not connect to backend');
                }
              }}>End Session</button>
              <button style={{ background: '#c0392b', color: 'white', padding: '6px 18px', border: 'none', borderRadius: 5 }} onClick={async () => {
                if (!window.confirm('Are you sure you want to DELETE this session and ALL its data? This cannot be undone.')) return;
                const token = localStorage.getItem('token');
                if (!token) { setMessage('You must be logged in as admin.'); return; }
                try {
                  const res = await fetch(`/api/admin/session/${sessionInfo._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setMessage('Session and all related data deleted.');
                    setSessionInfo(null);
                    fetchSessions();
                  } else {
                    setMessage(data.message || 'Failed to delete session');
                  }
                } catch {
                  setMessage('Could not connect to backend');
                }
              }}>Delete Session</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionCreate;
