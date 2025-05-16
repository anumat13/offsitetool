import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function TeamSubmit({ sessionId: propSessionId }) {
  const location = useLocation();
  const sessionId = location.state?.sessionId || propSessionId;
  const navigate = useNavigate();
  
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [personaCard, setPersonaCard] = useState('');
  const [mdbCardUsed, setMdbCardUsed] = useState('');
  const [aiCardUsed, setAiCardUsed] = useState('');
  const [wildCardUsed, setWildCardUsed] = useState('');
  const [solution, setSolution] = useState('');
  const [message, setMessage] = useState('');
  const [waitingForVoting, setWaitingForVoting] = useState(false);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const pollingRef = useRef(null);
  const timerRef = useRef(null);
  
  // Auto-submit function (separate from handleSubmit to avoid circular dependencies)
  const autoSubmit = useCallback(() => {
    if (!waitingForVoting) {
      // Time's up - show message
      setMessage('Time is up! Your submission has been automatically submitted.');
      
      // Auto-submit logic
      const submitForm = async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/team/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamName,
              teamMembers: teamMembers.split(',').map(m => m.trim()),
              personaCard,
              mdbCardUsed,
              aiCardUsed,
              wildCardUsed,
              productTitle,
              solution,
              sessionId
            })
          });
          const data = await res.json();
          if (res.ok) {
            setWaitingForVoting(true);
            // Start polling for voting to open
            pollingRef.current = setInterval(async () => {
              try {
                const voteRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
                const voteData = await voteRes.json();
                if (voteData.session && voteData.session.votingOpen) {
                  clearInterval(pollingRef.current);
                  // Redirect to voting page with sessionId and teamName as state
                  navigate('/team/vote', { state: { sessionId, teamName } });
                }
              } catch {}
            }, 5000);
          } else {
            setMessage(data.message || 'Submission failed');
          }
        } catch (err) {
          setMessage('Could not connect to backend');
        }
      };
      
      submitForm();
    }
  }, [navigate, sessionId, teamName, teamMembers, personaCard, mdbCardUsed, aiCardUsed, wildCardUsed, productTitle, solution, waitingForVoting]);

  useEffect(() => {
    document.title = 'Team Submission';
    // Check for active session by sessionId on mount
    const checkActiveSession = async () => {
      if (!sessionId) {
        navigate('/');
        return;
      }
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
        const data = await res.json();
        
        // If session doesn't exist or is not active, redirect to home
        if (!data.session || data.session.isActive === false) {
          navigate('/');
          return;
        }
        
        // If submissions are not open, redirect to home
        if (!data.session.submissionOpen) {
          navigate('/');
          return;
        }
        
        // Check if there's a submission timer for this session
        if (data.session.submissionTimerEnabled && data.session.submissionTimerEndTime) {
          const endTime = new Date(data.session.submissionTimerEndTime);
          const now = new Date();
          if (endTime > now) {
            setTimerEndTime(endTime);
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        navigate('/');
      }
    };
    checkActiveSession();
    
    // Also poll for session updates to get timer changes
    const interval = setInterval(async () => {
      if (sessionId) {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
          const data = await res.json();
          if (data.session && data.session.submissionTimerEnabled && data.session.submissionTimerEndTime) {
            const endTime = new Date(data.session.submissionTimerEndTime);
            const now = new Date();
            if (endTime > now) {
              setTimerEndTime(endTime);
            }
          }
        } catch (error) {
          console.error('Error polling session:', error);
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [navigate, sessionId, waitingForVoting, autoSubmit]);

  // State declarations moved to the top

  // Timer effect
  useEffect(() => {
    if (timerEndTime) {
      console.log('Timer end time set:', timerEndTime); // Debug log
      const updateTimer = () => {
        const now = new Date();
        const endTime = new Date(timerEndTime);
        const diff = endTime - now;
        
        if (diff <= 0) {
          setTimeRemaining(null);
          clearInterval(timerRef.current);
          // Time's up - show warning message instead of auto-submitting
          setMessage('Timer is up, please submit your reply');
        } else {
          // Calculate minutes and seconds
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining({ minutes, seconds });
          console.log('Time remaining:', minutes, 'minutes', seconds, 'seconds'); // Debug log
        }
      };
      
      // Update immediately and then every second
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [timerEndTime]);

  // Poll for session status; if ended, redirect to home
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


  const handleSubmit = async (e, autoSubmit = false) => {
    if (e) e.preventDefault();
    if (!autoSubmit && !window.confirm('Are you sure you want to submit this solution? You will not be able to edit your answer after you submit.')) return;
    
    // Clear timer if it exists
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setTimeRemaining(null);
    }
    
    if (!autoSubmit) setMessage('');
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/team/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          teamMembers: teamMembers.split(',').map(m => m.trim()),
          personaCard,
          mdbCardUsed,
          aiCardUsed,
          wildCardUsed,
          productTitle,
          solution,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Don't set message here, as it will be shown in the waiting screen
        setWaitingForVoting(true);
        // Start polling for votingOpen
        pollingRef.current = setInterval(async () => {
          try {
            const sessionRes = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/session/${sessionId}`);
            const sessionData = await sessionRes.json();
            if (sessionData.session && sessionData.session.votingOpen) {
              clearInterval(pollingRef.current);
              // Redirect to voting page with sessionId and teamName as state
              navigate('/team/vote', { state: { sessionId, teamName } });
            }
          } catch {}
        }, 5000);
      } else {
        setMessage(data.message || 'Submission failed');
      }
    } catch (err) {
      setMessage('Could not connect to backend');
    }
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="mongodb-theme" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="mongodb-card" style={{ padding: '24px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 className="mdb-header-2" style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--mdb-primary-color)' }}>Team Submission</h2>
        
        {/* Message display */}
        {message && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '12px', 
            backgroundColor: message.toLowerCase().includes('received') ? 'var(--mdb-success-color-light)' : 'var(--mdb-warning-color-light)', 
            borderRadius: '8px',
            color: message.toLowerCase().includes('received') ? 'var(--mdb-success-color-dark)' : 'var(--mdb-warning-text-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className={`fas fa-${message.toLowerCase().includes('received') ? 'check-circle' : 'exclamation-triangle'}`}></i>
            {message}
          </div>
        )}
        
        {!waitingForVoting ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column */}
              <div>
                {/* Team Information Section */}
                <div className="form-section" style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--mdb-primary-color)', marginBottom: '16px', borderBottom: '1px solid var(--mdb-border-color)', paddingBottom: '8px' }}>
                    <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                    Team Information
                  </h3>
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="teamName" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Team Number <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      id="teamName"
                      type="text" 
                      placeholder="Enter your team number" 
                      value={teamName} 
                      onChange={e => setTeamName(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="teamMembers" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Team Members <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      id="teamMembers"
                      type="text" 
                      placeholder="Enter team member names separated by commas" 
                      value={teamMembers} 
                      onChange={e => setTeamMembers(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: 'var(--mdb-text-color-light)', fontSize: '0.8rem' }}>
                      Example: John, Jane
                    </small>
                  </div>
                </div>
                
                {/* Cards Used Section */}
                <div className="form-section" style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--mdb-primary-color)', marginBottom: '16px', borderBottom: '1px solid var(--mdb-border-color)', paddingBottom: '8px' }}>
                    <i className="fas fa-id-card" style={{ marginRight: '8px' }}></i>
                    Cards Used
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="personaCard" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                        Persona Card <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input 
                        id="personaCard"
                        type="text" 
                        placeholder="Enter persona card" 
                        value={personaCard} 
                        onChange={e => setPersonaCard(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="mdbCardUsed" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                        MongoDB Card <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input 
                        id="mdbCardUsed"
                        type="text" 
                        placeholder="Enter MongoDB card" 
                        value={mdbCardUsed} 
                        onChange={e => setMdbCardUsed(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="aiCardUsed" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                        AI Card <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input 
                        id="aiCardUsed"
                        type="text" 
                        placeholder="Enter AI card" 
                        value={aiCardUsed} 
                        onChange={e => setAiCardUsed(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="wildCardUsed" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                        Wild Card (Optional)
                      </label>
                      <input 
                        id="wildCardUsed"
                        type="text" 
                        placeholder="Enter wild card (if any)" 
                        value={wildCardUsed} 
                        onChange={e => setWildCardUsed(e.target.value)} 
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div>
                {/* Product Information Section */}
                <div className="form-section" style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--mdb-primary-color)', marginBottom: '16px', borderBottom: '1px solid var(--mdb-border-color)', paddingBottom: '8px' }}>
                    <i className="fas fa-lightbulb" style={{ marginRight: '8px' }}></i>
                    User Story
                  </h3>
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="productTitle" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Problem Statement <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input 
                      id="productTitle"
                      type="text" 
                      placeholder="Enter your problem statement or use case" 
                      value={productTitle} 
                      onChange={e => setProductTitle(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)' }}
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: 'var(--mdb-text-color-light)', fontSize: '0.8rem' }}>
                      A one liner for your problem statement
                    </small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="solution" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Solution Description <span style={{ color: 'red' }}>*</span>
                    </label>
                    <textarea 
                      id="solution"
                      placeholder="Describe your solution in 4-5 bullet points" 
                      value={solution} 
                      onChange={e => setSolution(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--mdb-border-color)', minHeight: '250px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="mdb-btn mdb-btn-primary" 
              style={{ 
                padding: '12px', 
                marginTop: '24px', 
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%'
              }}
            >
              <i className="fas fa-paper-plane"></i>
              Submit Team Solution
            </button>
            
            {/* Timer display at the bottom of the form */}
            {timeRemaining && (
              <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: timeRemaining.minutes < 5 ? '#FFF3CD' : '#E8F0FE',
                borderRadius: '8px',
                border: `2px solid ${timeRemaining.minutes < 5 ? '#FFC107' : '#4285F4'}`,
                textAlign: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: timeRemaining.minutes < 5 ? '#FFC107' : '#4285F4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}>
                    <i className="fas fa-clock" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: timeRemaining.minutes < 5 ? '#D97706' : '#1A73E8' }}>
                      {timeRemaining.minutes}:{timeRemaining.seconds < 10 ? `0${timeRemaining.seconds}` : timeRemaining.seconds}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '500', color: timeRemaining.minutes < 5 ? '#B45309' : '#174EA6' }}>
                      {timeRemaining.minutes < 5 ? 'HURRY UP!' : 'TIME REMAINING'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        ) : (
          <div className="waiting-container" style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--mdb-primary-color-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <i className="fas fa-check" style={{ fontSize: '40px', color: 'var(--mdb-primary-color)' }}></i>
            </div>
            <h3 style={{ color: 'var(--mdb-primary-color)', marginBottom: '16px' }}>Submission Received!</h3>
            <p style={{ marginBottom: '24px' }}>Waiting for the admin to open voting...</p>
            <div className="mdb-spinner mdb-spinner-small" style={{ margin: '0 auto' }}></div>
          </div>
        )}
        
        {message && (
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            backgroundColor: message.toLowerCase().includes('received') ? 'var(--mdb-success-color-light)' : 'var(--mdb-warning-color-light)', 
            borderRadius: '8px',
            color: message.toLowerCase().includes('received') ? 'var(--mdb-success-color-dark)' : 'var(--mdb-warning-text-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className={`fas fa-${message.toLowerCase().includes('received') ? 'check-circle' : 'exclamation-triangle'}`}></i>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamSubmit;
