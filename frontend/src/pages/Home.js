import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import TeamSubmit from './TeamSubmit';
import Spinner from '../Spinner';

function Home() {
  useEffect(() => { document.title = 'Icebreaker Home'; }, []);
  const navigate = useNavigate();
  const [sessionExists, setSessionExists] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [votingOpen, setVotingOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const pollingIntervalRef = useRef(null);

  const fetchAndUpdateSessionStatus = async () => {
    if (sessionId) {
      try {
        const res = await fetch(`/api/session/${sessionId}`);
        const data = await res.json();
        if (res.ok && data.session) {
          if (data.session.isActive === false) {
            setSessionExists(false);
            setSubmissionOpen(false);
            setVotingOpen(false);
            setSessionId(null);
          } else {
            setSessionExists(true);
            setSubmissionOpen(data.session.submissionOpen === true);
            setVotingOpen(data.session.votingOpen === true);
          }
        } else {
          console.error('Polling error or session not found, resetting:', data.message || 'No session data');
          setSessionExists(false);
          setSubmissionOpen(false);
          setVotingOpen(false);
          setSessionId(null);
        }
      } catch (error) {
        console.error('Error polling specific session:', error);
      }
    } else {
      try {
        const res = await fetch('/api/admin/sessions/recent');
        const data = await res.json();
        const activeSessions = Array.isArray(data.sessions)
          ? data.sessions.filter(s => s.isActive !== false)
          : [];

        if (activeSessions.length > 0) {
          const currentSession = activeSessions[0];
          setSessionExists(true);
          setSessionId(currentSession._id);
          setSubmissionOpen(currentSession.submissionOpen === true);
          setVotingOpen(currentSession.votingOpen === true);
        } else {
          setSessionExists(false);
          setSubmissionOpen(false);
          setVotingOpen(false);
        }
      } catch (error) {
        console.error('Error checking for recent sessions:', error);
        setSessionExists(false);
        setSubmissionOpen(false);
        setVotingOpen(false);
        setSessionId(null);
      }
    }
    if (checking) setChecking(false);
  };

  useEffect(() => {
    fetchAndUpdateSessionStatus();

    pollingIntervalRef.current = setInterval(fetchAndUpdateSessionStatus, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionId]);

  const handleGoToSubmission = () => {
    navigate('/team/submit', { state: { sessionId } });
  };

  return (
    <div className="mongodb-theme">
      <img src="/logo.svg" alt="App Logo" className="mongodb-logo" />
      <div className="mongodb-card mdb-center">
        <h1>MongoDB AI Workshop: Icebreaker App</h1>
        {checking ? (
          <Spinner label="Checking for session..." />
        ) : sessionExists ? (
          <>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {submissionOpen ? (
                <div className="mdb-message-success" style={{ marginBottom: '20px' }}>
                  <i className="fas fa-check-circle" style={{ marginRight: '10px' }}></i>
                  Submissions are now open! You can now submit your team's solution.
                </div>
              ) : sessionExists && !submissionOpen && votingOpen ? (
                <div className="mdb-message-info" style={{ marginBottom: '20px' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i>
                  Submissions are closed. Voting is now open!
                </div>
              ) : sessionExists && !submissionOpen && !votingOpen ? (
                <div className="mdb-message-info" style={{ marginBottom: '20px' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i>
                  Submissions are currently closed. Waiting for voting to begin or submissions to reopen.
                </div>
              ) : (
                <div className="mdb-message-info" style={{ marginBottom: '20px' }}>
                  <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i>
                  Welcome! Submissions are not yet open. Please wait for the admin to enable them.
                </div>
              )}
              
              <button 
                onClick={handleGoToSubmission}
                className="mdb-btn mdb-btn-primary"
                disabled={!submissionOpen} 
                style={{
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '0 auto',
                  cursor: !submissionOpen ? 'not-allowed' : 'pointer', 
                  opacity: !submissionOpen ? 0.6 : 1 
                }}
              >
                <i className="fas fa-edit"></i>
                Go to Team Submission
              </button>
            </div>

            {sessionExists && !submissionOpen && votingOpen && (
              <div style={{ marginTop: '30px', padding: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                <h3>Ready to Vote?</h3>
                <p>Voting is open! Scan the QR code below with your mobile device to cast your vote.</p>
                <QRCodeCanvas 
                  value={window.location.origin + '/team/vote'} 
                  size={128} 
                  bgColor={"#ffffff"} 
                  fgColor={"#000000"} 
                  level={"L"} 
                />
                <p style={{ marginTop: '10px' }}>
                  Or visit directly: <a href={window.location.origin + '/team/vote'} target="_blank" rel="noopener noreferrer">{window.location.origin + '/team/vote'}</a>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="mdb-message-info">
            <i className="fas fa-info-circle" style={{ marginRight: '10px' }}></i>
            Welcome! Please wait for the admin to start the session.
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
