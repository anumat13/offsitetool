import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Results() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'Session Results';
    // Check for active session on mount
    const checkActiveSession = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/admin/sessions/recent`);
        const data = await res.json();
        const active = Array.isArray(data.sessions)
          ? data.sessions.find(s => s.isActive !== false)
          : null;
        if (!active) {
          navigate('/');
        }
      } catch {
        navigate('/');
      }
    };
    checkActiveSession();
  }, [navigate]);
  const [sessionId, setSessionId] = useState('');
  const [teams, setTeams] = useState([]);
  const [winners, setWinners] = useState([]);
  const [message, setMessage] = useState('');
  const pollingRef = useRef(null);

  // Find the current active session on mount
  // Set sessionId to the active session (if any)
  useEffect(() => {
    const findActiveSession = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/admin/sessions/recent`);
        const data = await res.json();
        const active = Array.isArray(data.sessions)
          ? data.sessions.find(s => s.isActive !== false)
          : null;
        if (active) {
          setSessionId(active._id || active.sessionId);
        } else {
          navigate('/');
        }
      } catch {
        setMessage('Could not connect to backend');
      }
    };
    findActiveSession();
  }, [navigate]);

  // Poll session status; if ended, redirect to home
  useEffect(() => {
    if (!sessionId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
        const data = await res.json();
        if (data.session && data.session.isActive === false) {
          clearInterval(pollingRef.current);
          navigate('/');
        }
      } catch {}
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [sessionId, navigate]);

  // Fetch results for the current session
  useEffect(() => {
    const fetchResults = async () => {
      if (!sessionId) return;
      setMessage('');
      setTeams([]);
      setWinners([]);
      try {
        const sessionRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok || !sessionData.session) {
          setMessage('Session not found.');
          return;
        }
        if (!sessionData.session.resultsPublished) {
          setMessage('Results are not yet published for this session.');
          return;
        }
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}/results`);
        const data = await res.json();
        if (res.ok) {
          setTeams(data.teams);
          setWinners(data.winners);
          if (data.teams.length === 0) {
            setMessage('No teams found for this session.');
          }
        } else {
          setMessage(data.message || 'Could not fetch results');
        }
      } catch (err) {
        setMessage('Could not connect to backend');
      }
    };
    fetchResults();
  }, [sessionId]);

  const isWinner = (teamId) => winners.some(w => w._id === teamId);

  // Helper to sort teams for ranking, winner(s) first, then by votes
  const getRankedTeams = () => {
    if (!teams) return [];
    return [...teams].sort((a, b) => {
      const aIsWinner = winners.some(w => w._id === a._id);
      const bIsWinner = winners.some(w => w._id === b._id);
      if (aIsWinner && !bIsWinner) return -1;
      if (!aIsWinner && bIsWinner) return 1;
      return b.totalVotes - a.totalVotes; // Then by votes descending
    });
  };

  const rankedTeams = getRankedTeams();
  const primaryWinner = winners && winners.length > 0 ? winners[0] : null;

  if (message && (!teams || teams.length === 0) && !primaryWinner) {
    // Display only message if critical (e.g., not published, no session, fetch error)
    return (
      <div className="mongodb-theme results-page" style={{ padding: '20px', textAlign: 'center' }}>
        <h2 className="mdb-header-2" style={{ color: 'var(--mdb-text-color)' }}>{message}</h2>
        <button onClick={() => navigate('/')} className="mdb-btn mdb-btn-primary" style={{ marginTop: '20px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="mongodb-theme results-page" style={{ padding: '20px' }}>
      <style>
        {`
          .results-page {
            max-width: 1200px;
            margin: 0 auto;
          }
          .results-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--mdb-border-color, #e0e0e0);
          }
          .results-header h1 {
            color: var(--mdb-primary-color, #00684A);
            font-size: 2.8rem;
            margin-bottom: 8px;
          }
          .results-header p {
            font-size: 1.2rem;
            color: var(--mdb-text-color-light, #5f6368);
          }
          .winner-display-section {
            background: linear-gradient(135deg, var(--mdb-success-color-light, #E6F4EA) 0%, #f8fffa 100%);
            border: 2px solid var(--mdb-success-color, #34A853);
            border-radius: 16px;
            padding: 40px;
            margin-bottom: 50px;
            text-align: center;
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
          }
          .winner-display-section .trophy-icon {
            font-size: 4rem;
            color: gold;
            margin-bottom: 15px;
          }
          .winner-display-section h2 {
            color: var(--mdb-success-color-dark, #1E8E3E);
            font-size: 2.2rem;
            margin-bottom: 10px;
          }
          .winner-card {
            background-color: #fff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            width: 85%; /* Wider card */
            max-width: 800px; /* Increased max width */
            margin: 0 auto; /* Center the card */
            text-align: left;
            border: 1px solid var(--mdb-success-color-light);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .winner-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.2);
          }
          .winner-card h3 {
            color: var(--mdb-primary-color);
            font-size: 2.2rem;
            margin-bottom: 20px;
            border-bottom: 2px solid var(--mdb-success-color-light);
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .winner-card h3 i {
            color: gold;
          }
          .winner-card .details p, .winner-card .solution-text p {
            font-size: 1.2rem;
            margin-bottom: 15px;
            color: var(--mdb-text-color, #3c4043);
            line-height: 1.6;
          }
          .winner-card .details strong {
            color: var(--mdb-text-color-dark, #202124);
          }
          .winner-card .votes {
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--mdb-primary-color);
            margin-top: 20px;
            background-color: var(--mdb-primary-color-light);
            display: inline-block;
            padding: 10px 20px;
            border-radius: 30px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .team-ranking-section h2 {
            text-align: center;
            color: var(--mdb-text-color-dark, #202124);
            font-size: 2rem;
            margin-bottom: 30px;
          }
          .team-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
          }
          .team-card {
            background-color: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-left: 5px solid var(--mdb-secondary-color, #4285F4);
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          }
          .team-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.12);
          }
          .team-card.is-winner-card {
             border-left-color: var(--mdb-success-color, #34A853);
          }
          .team-card h4 {
            color: var(--mdb-primary-color, #00684A);
            font-size: 1.4rem;
            margin-bottom: 8px;
          }
          .team-card p {
            font-size: 1rem;
            color: var(--mdb-text-color, #3c4043);
            margin-bottom: 8px;
          }
          .team-card .votes-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9rem;
            font-weight: bold;
            color: #fff;
            background-color: var(--mdb-secondary-color-dark, #1a73e8);
          }
          .team-card.is-winner-card .votes-badge {
            background-color: var(--mdb-success-color-dark, #1E8E3E);
          }
          .solution-preview {
            font-style: italic;
            color: var(--mdb-text-color-light);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px; /* Adjust as needed */
            cursor: pointer;
          }
          .solution-full {
            white-space: pre-line;
            background-color: var(--mdb-background-color-light, #f8f9fa);
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
          }
        `}
      </style>

      <div className="results-header">
        <h1>Session Results</h1>
        <p>The votes are in! Here's how the teams performed.</p>
      </div>

      {/* Winner Display Section */}
      {primaryWinner && (
        <section className="winner-display-section">
          <div className="trophy-icon"><i className="fas fa-trophy"></i></div>
          <h2>And The Winner Is...</h2>
          <div className="winner-card">
            <h3><i className="fas fa-crown"></i> {primaryWinner.teamName}</h3>
            <div className="details">
              <p><strong>Problem Statement/Use Case:</strong> {primaryWinner.productTitle || 'N/A'}</p>
              {primaryWinner.solution && (
                <div className="solution-text">
                  <p><strong>Winning Solution:</strong></p>
                  <div style={{whiteSpace: 'pre-line', backgroundColor: 'var(--mdb-background-color-light)', padding: '20px', borderRadius: '8px', border: '1px solid var(--mdb-border-color)'}}>{primaryWinner.solution}</div>
                </div>
              )}
              <p className="votes"><i className="fas fa-vote-yea"></i> Total Votes: {primaryWinner.totalVotes}</p>
            </div>
          </div>
        </section>
      )}

      {/* Team Ranking Section */}
      {rankedTeams && rankedTeams.length > 0 && (
        <section className="team-ranking-section">
          <h2>Full Standings</h2>
          {message && !primaryWinner && <p style={{textAlign: 'center', color: 'var(--mdb-warning-color-dark)', marginBottom: '20px'}}>{message}</p>} 
          <div className="team-list">
            {rankedTeams.map((team, index) => (
              <div key={team._id} className={`team-card ${winners.some(w => w._id === team._id) && team._id === primaryWinner?._id ? 'is-winner-card' : ''}`}>
                <h4>{index + 1}. {team.teamName}</h4>
                <p><strong>Problem Statement/Use Case:</strong> {team.productTitle || 'N/A'}</p>
                {team.solution && (
                  <details>
                    <summary className="solution-preview">View Solution</summary>
                    <div className="solution-full">{team.solution}</div>
                  </details>
                )}
                <p><span className="votes-badge">{team.totalVotes} Votes</span></p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fallback message if no teams and no specific error message */}
      {(!rankedTeams || rankedTeams.length === 0) && !message && (
         <p style={{textAlign: 'center', fontSize: '1.2rem', marginTop: '30px'}}>No submissions were made in this session.</p>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button onClick={() => navigate('/')} className="mdb-btn mdb-btn-secondary">
          <i className="fas fa-home" style={{marginRight: '8px'}}></i>Back to Home
        </button>
      </div>
    </div>
  );
}

export default Results;
