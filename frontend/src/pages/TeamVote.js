import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function TeamVote() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'Team Voting';
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
        } else {
          setSessionId(active._id || active.sessionId);
        }
      } catch {
        navigate('/');
      }
    };
    checkActiveSession();
  }, [navigate]);
  const [sessionId, setSessionId] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterTeam, setVoterTeam] = useState('');
  const [isNotMemberOfTeam, setIsNotMemberOfTeam] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'vote', 'waitingResults'
  const [waiting, setWaiting] = useState(false);
  const pollingRef = useRef(null);
  const location = useLocation();

  // If coming from TeamSubmit, auto-fill sessionId/teamName
  useEffect(() => {
    if (location.state && location.state.sessionId && location.state.teamName) {
      setSessionId(location.state.sessionId);
      setVoterTeam(location.state.teamName);
    }
  }, [location.state]);

  // Fetch all teams in session
  const fetchTeams = async (e) => {
    if (e) e.preventDefault();
    setMessage('');
    try {
      // Fetch session info first
      const sessionRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || !sessionData.session) {
        setMessage('Session not found.');
        return;
      }
      if (sessionData.session.isActive === false) {
        navigate('/');
        return;
      }
      if (!sessionData.session.votingOpen) {
        setStep('waiting');
        setWaiting(true);
        return;
      }
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}/teams`);
      const data = await res.json();
      if (res.ok) {
        if (data.teams.length === 0) {
          setMessage('No teams found in this session.');
        } else {
          setTeams(data.teams);
          setStep('vote');
        }
      } else {
        setMessage(data.message || 'Could not fetch teams');
      }
    } catch (err) {
      setMessage('Could not connect to backend');
    }
  };

  // Poll for votingOpen if waiting
  useEffect(() => {
    if (waiting && sessionId) {
      pollingRef.current = setInterval(async () => {
        try {
          const sessionRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
          const sessionData = await sessionRes.json();
          if (sessionData.session && sessionData.session.isActive === false) {
            clearInterval(pollingRef.current);
            navigate('/');
            return;
          }
          if (sessionData.session && sessionData.session.votingOpen) {
            clearInterval(pollingRef.current);
            setWaiting(false);
            fetchTeams();
          }
        } catch {}
      }, 5000);
      return () => clearInterval(pollingRef.current);
    }
  }, [waiting, sessionId]);

  // Poll for resultsPublished after voting
  useEffect(() => {
    if (step === 'waitingResults' && sessionId) {
      pollingRef.current = setInterval(async () => {
        try {
          const sessionRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
          const sessionData = await sessionRes.json();
          if (sessionData.session && sessionData.session.isActive === false) {
            clearInterval(pollingRef.current);
            navigate('/');
            return;
          }
          if (sessionData.session && sessionData.session.resultsPublished) {
            clearInterval(pollingRef.current);
            navigate('/results', { state: { sessionId } });
          }
        } catch {}
      }, 5000);
      return () => clearInterval(pollingRef.current);
    }
  }, [step, sessionId, navigate]);

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    // Validation for required fields
    if (!voterName) {
      setMessage('Please enter your name.');
      return;
    }
    if (!isNotMemberOfTeam && !voterTeam) {
      setMessage('Please enter your team name, or check the box if you are not part of a team.');
      return;
    }

    setMessage('');

    const teamNameToSubmit = isNotMemberOfTeam ? 'Guest Voter' : voterTeam;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          voterName,
          voterTeam: teamNameToSubmit,
          votedForTeamId: selectedTeamId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStep('waitingResults');
      } else {
        setMessage(data.message || 'Could not submit vote');
      }
    } catch (err) {
      setMessage('Could not connect to backend');
    }
  };

  return (
    <div className="mongodb-theme" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="mongodb-card" style={{ padding: '24px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 className="mdb-header-2" style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--mdb-primary-color)' }}>Team Voting</h2>
        
        {step === 'form' && (
          <form onSubmit={fetchTeams} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="voterName" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Your Name:</label>
              <input 
                id="voterName"
                type="text" 
                placeholder="Enter your name" 
                value={voterName} 
                onChange={e => setVoterName(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
              />
            </div>
            
            <div className="form-group"> {/* Checkbox group */}
              <label htmlFor="isNotMember" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'normal' }}>
                <input
                  type="checkbox"
                  id="isNotMember"
                  checked={isNotMemberOfTeam}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setIsNotMemberOfTeam(isChecked);
                    if (isChecked) {
                      setVoterTeam(''); // Clear team name if they check it
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                I am not a member of any participating team.
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="voterTeam" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Your Team Name:</label>
              <input 
                id="voterTeam"
                type="text" 
                placeholder={isNotMemberOfTeam ? "Not applicable" : "Enter your team name"} 
                value={voterTeam} 
                onChange={e => setVoterTeam(e.target.value)} 
                required={!isNotMemberOfTeam} 
                disabled={isNotMemberOfTeam} 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
              />
            </div>
            <button 
              type="submit" 
              className="mdb-btn mdb-btn-primary" 
              style={{ padding: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <i className="fas fa-arrow-right"></i>
              Proceed to Voting
            </button>
          </form>
        )}
        
        {step === 'waiting' && (
          <div className="waiting-container" style={{ textAlign: 'center', padding: '30px 0' }}>
            <div className="mdb-spinner" style={{ margin: '0 auto 20px auto' }}></div>
            <h3 style={{ color: 'var(--mdb-primary-color)', marginBottom: '16px' }}>Waiting for voting to begin...</h3>
            <p style={{ color: 'var(--mdb-text-color-light)' }}>The admin will open voting shortly. This page will automatically update when voting begins.</p>
          </div>
        )}
        
        {step === 'vote' && (
          <div className="voting-container">
            <div 
              style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                backgroundColor: 'var(--mdb-primary-color-light)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-user" style={{ color: 'var(--mdb-primary-color)' }}></i>
              <span style={{ fontWeight: 'bold', color: 'var(--mdb-primary-color)' }}>
                Voter: {voterName} from Team {voterTeam}
              </span>
            </div>
            
            <h3 className="mdb-header-3" style={{ marginBottom: '16px' }}>Select a team to vote for:</h3>
            
            <form onSubmit={handleVote}>
              <div className="teams-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {teams.map(team => (
                  <div 
                    key={team._id} 
                    className={`team-card ${selectedTeamId === team._id ? 'selected' : ''}`}
                    style={{ 
                      border: `2px solid ${selectedTeamId === team._id ? 'var(--mdb-primary-color)' : 'var(--mdb-border-color)'}`,
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: selectedTeamId === team._id ? 'var(--mdb-primary-color-light)' : 'var(--mdb-background-color)'
                    }}
                    onClick={() => setSelectedTeamId(team._id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <input
                        type="radio"
                        name="votedForTeamId"
                        value={team._id}
                        checked={selectedTeamId === team._id}
                        onChange={e => setSelectedTeamId(e.target.value)}
                        required
                        style={{ marginTop: '4px' }}
                      />
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ 
                            display: 'inline-block', 
                            backgroundColor: 'var(--mdb-primary-color)', 
                            color: 'white', 
                            padding: '4px 10px', 
                            borderRadius: '4px',
                            marginBottom: '8px',
                            fontSize: '0.9rem'
                          }}>
                            {team.teamName || 'Team'}
                          </div>
                          
                          <h4 style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: '700', 
                            marginBottom: '8px',
                            color: selectedTeamId === team._id ? 'var(--mdb-primary-color-dark)' : 'inherit'
                          }}>
                            {team.productTitle || 'Product in development'}
                          </h4>
                        </div>
                        
                        <div className="solution-container" style={{ 
                          backgroundColor: selectedTeamId === team._id ? 'rgba(255,255,255,0.7)' : 'var(--mdb-background-color-light)', 
                          padding: '12px', 
                          borderRadius: '6px',
                          marginBottom: '8px',
                          border: '1px solid var(--mdb-border-color)'
                        }}>
                          <h6 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px', color: 'var(--mdb-primary-color)' }}>Solution:</h6>
                          <p style={{ margin: '0', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>{team.solution || 'Solution details will be presented during voting'}</p>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '8px',
                          marginTop: '8px'
                        }}>
                          {team.personaCard && (
                            <span style={{
                              backgroundColor: 'var(--mdb-warning-color-light)',
                              color: 'var(--mdb-warning-color-dark)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.8rem'
                            }}>
                              Persona: {team.personaCard}
                            </span>
                          )}
                          {team.mdbCardUsed && (
                            <span style={{
                              backgroundColor: 'var(--mdb-primary-color-light)',
                              color: 'var(--mdb-primary-color)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.8rem'
                            }}>
                              MongoDB: {team.mdbCardUsed}
                            </span>
                          )}
                          {team.aiCardUsed && (
                            <span style={{
                              backgroundColor: 'var(--mdb-info-color-light)',
                              color: 'var(--mdb-info-color-dark)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.8rem'
                            }}>
                              AI: {team.aiCardUsed}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="submit" 
                className="mdb-btn mdb-btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                disabled={!selectedTeamId}
              >
                <i className="fas fa-vote-yea"></i>
                Submit Your Vote
              </button>
            </form>
          </div>
        )}
        
        {step === 'waitingResults' && (
          <div className="success-container" style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--mdb-success-color-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <i className="fas fa-check" style={{ fontSize: '40px', color: 'var(--mdb-success-color)' }}></i>
            </div>
            <h3 style={{ color: 'var(--mdb-success-color)', marginBottom: '16px' }}>Vote Submitted Successfully!</h3>
            <p style={{ marginBottom: '24px' }}>Waiting for the admin to publish results...</p>
            <div className="mdb-spinner mdb-spinner-small" style={{ margin: '0 auto' }}></div>
            {message && message.toLowerCase().includes('already voted') && (
              <div style={{ 
                marginTop: '20px', 
                padding: '12px', 
                backgroundColor: 'var(--mdb-warning-color-light)', 
                borderRadius: '8px',
                color: 'var(--mdb-warning-text-color)'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                {message}
              </div>
            )}
          </div>
        )}
        
        {message && step !== 'waitingResults' && (
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            backgroundColor: 'var(--mdb-warning-color-light)', 
            borderRadius: '8px',
            color: 'var(--mdb-warning-text-color)'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamVote;
