import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionCreateForm from '../components/SessionCreateForm';
import SessionList from '../components/SessionList';
import SessionDetailView from '../components/SessionDetailView';
import {
    fetchAllSessionsAPI,
    deleteSessionAPI,
    endSessionAPI,
    toggleSubmissionAPI,
    toggleVotingAPI,
    toggleResultsAPI,
    fetchSessionDetailsAPI,
    fetchSessionTeamsAPI,
    fetchSessionMetricsAPI,
} from '../services/adminApi'; 
import '../styles/mongodb-theme.css';

function AdminManage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionFull, setSelectedSessionFull] = useState(null); 
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]); 
  const [actualSubmissionsCount, setActualSubmissionsCount] = useState(0);
  const [totalVotesCast, setTotalVotesCast] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false); 
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  const fetchAllSessionsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllSessionsAPI();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || 'Could not fetch sessions');
      if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        navigate('/admin'); 
      }
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken'); 
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchAllSessionsData();
  }, [navigate, fetchAllSessionsData]);

  const handleRefreshSessions = () => {
    setSuccessMessage('Refreshing sessions...');
    fetchAllSessionsData().then(() => {
      setTimeout(() => setSuccessMessage(''), 2000); 
    });
    if (selectedSessionFull) {
      handleSelectSession(selectedSessionFull, true); 
    }
  };

  const handleSelectSession = useCallback(async (sessionFromList, isRefresh = false) => {
    setSelectedSessionFull(null); 
    setLoadingDetails(true);
    setError('');
    setSuccessMessage('');
    setTeams([]);
    setSubmissions([]); 
    setActualSubmissionsCount(0); 
    setTotalVotesCast(0);

    try {
      const currentFullSession = sessions.find(s => s._id === sessionFromList._id) || sessionFromList;
      
      const transformedSession = {
        _id: currentFullSession._id,
        name: currentFullSession.sessionName, 
        status: currentFullSession.isActive === false ? 'ended' : 'active', 
        isSubmissionOpen: currentFullSession.submissionOpen || false,
        isVotingOpen: currentFullSession.votingOpen || false,
        showResults: currentFullSession.resultsPublished || false,
        sessionCode: currentFullSession.code || currentFullSession.sessionCode,
        createdAt: currentFullSession.createdAt,
        endedAt: currentFullSession.endedAt,
        submissionTimerEnabled: currentFullSession.submissionTimerEnabled || false,
        submissionTimerDuration: currentFullSession.submissionTimerDuration,
        submissionTimerEndTime: currentFullSession.submissionTimerEndTime,
        timerEnabled: currentFullSession.timerEnabled || false,
        timerDuration: currentFullSession.timerDuration,
        timerEndTime: currentFullSession.timerEndTime
      };
      
      setSelectedSessionFull(transformedSession); 

      const teamsData = await fetchSessionTeamsAPI(sessionFromList._id);
      
      setTeams(teamsData.teams || []);
      setSubmissions(teamsData.teams || []); 

      try {
        const metricsData = await fetchSessionMetricsAPI(sessionFromList._id);
        setActualSubmissionsCount(metricsData.submittedTeamsCount || 0);
        setTotalVotesCast(metricsData.totalVotesCast || 0);
      } catch (metricsErr) {
        console.warn(`Could not fetch metrics for session ${sessionFromList._id}: ${metricsErr.message}`);
      }

      const refreshedSessions = await fetchAllSessionsAPI();
      setSessions(refreshedSessions.sessions || []);
      const updatedSession = (refreshedSessions.sessions || []).find(s => s._id === sessionFromList._id);
      
      if (updatedSession) {
        const transformedUpdatedSession = {
          _id: updatedSession._id,
          name: updatedSession.sessionName,
          status: updatedSession.isActive === false ? 'ended' : 'active',
          isVotingOpen: updatedSession.votingOpen || false,
          showResults: updatedSession.resultsPublished || false,
          sessionCode: updatedSession.code || updatedSession.sessionCode,
          createdAt: updatedSession.createdAt,
          endedAt: updatedSession.endedAt
        };
        setSelectedSessionFull(transformedUpdatedSession);
      } else {
        setSelectedSessionFull(transformedSession);
      }

    } catch (err) {
      setError(`Error fetching details for session ID ${sessionFromList._id}: ${err.message}`);
      
      const fallbackTransformedSession = {
        _id: sessionFromList._id,
        name: sessionFromList.sessionName,
        status: sessionFromList.isActive === false ? 'ended' : 'active',
        isVotingOpen: sessionFromList.votingOpen || false,
        showResults: sessionFromList.resultsPublished || false,
        sessionCode: sessionFromList.code || sessionFromList.sessionCode,
        createdAt: sessionFromList.createdAt,
        endedAt: sessionFromList.endedAt
      };
      
      setSelectedSessionFull(fallbackTransformedSession); 
    }
    setLoadingDetails(false);
  }, [sessions]);

  const handleSessionUpdate = async (operationMessage, operationPromise) => {
    setError('');
    setSuccessMessage('');
    try {
      await operationPromise;
      setSuccessMessage(operationMessage);
      await fetchAllSessionsData(); 
      if (selectedSessionFull) {
        const updatedSessionData = await fetchAllSessionsAPI();
        const foundSession = (updatedSessionData.sessions || []).find(s => s._id === selectedSessionFull._id);
        if (foundSession) {
            await handleSelectSession(foundSession); 
        } else {
            setSelectedSessionFull(null); 
            setTeams([]);
            setSubmissions([]);
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleEndSession = (sessionId, event) => {
    if (window.confirm('Are you sure you want to end this session?')) {
      event?.preventDefault?.();
      
      handleSessionUpdate('Session ended successfully.', endSessionAPI(sessionId));
    }
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      handleSessionUpdate('Session deleted successfully.', deleteSessionAPI(sessionId));
    }
  };

  const handleToggleSubmission = (sessionId, currentSubmissionOpen, event, timerDuration = 0, skipConfirmation = false) => {
    const newSubmissionOpen = skipConfirmation ? true : !currentSubmissionOpen;
    const action = newSubmissionOpen ? 'open' : 'close';
    
    let successMessage = `Submissions ${action}ed successfully.`;
    if (newSubmissionOpen && timerDuration > 0) {
      successMessage = `Submissions opened with a ${timerDuration} minute timer.`;
    }
    
    if (skipConfirmation) {
      event?.preventDefault?.();
      
      console.log('Setting timer with duration:', timerDuration, 'minutes');
      
      handleSessionUpdate(
        successMessage,
        toggleSubmissionAPI(sessionId, newSubmissionOpen, timerDuration)
      );
      return;
    }
    
    let confirmMessage = `Are you sure you want to ${action} submissions for this session?`;
    if (newSubmissionOpen && timerDuration > 0) {
      confirmMessage = `Are you sure you want to open submissions with a ${timerDuration} minute timer?`;
    }
  
    if (window.confirm(confirmMessage)) {
      event?.preventDefault?.();
      
      handleSessionUpdate(
        successMessage,
        toggleSubmissionAPI(sessionId, newSubmissionOpen, timerDuration)
      );
    }
  };

  const handleToggleVoting = (sessionId, currentVotingOpen, event, timerDuration = 0) => {
    const newVotingOpen = !currentVotingOpen;
    const action = newVotingOpen ? 'open' : 'close';
    
    let confirmMessage = `Are you sure you want to ${action} voting for this session?`;
    if (newVotingOpen && timerDuration > 0) {
      confirmMessage = `Are you sure you want to open voting with a ${timerDuration} minute timer?`;
    }
  
    if (window.confirm(confirmMessage)) {
      event?.preventDefault?.();
      
      let successMessage = `Voting ${action}ed successfully.`;
      if (newVotingOpen && timerDuration > 0) {
        successMessage = `Voting opened with a ${timerDuration} minute timer.`;
      }
      
      handleSessionUpdate(
        successMessage,
        toggleVotingAPI(sessionId, newVotingOpen, timerDuration)
      );
    }
  };

  const handleToggleResults = (sessionId, currentResultsPublished, event) => {
    const newResultsPublished = !currentResultsPublished;
    const action = newResultsPublished ? 'publish' : 'unpublish';
    
    if (window.confirm(`Are you sure you want to ${action} results for this session?`)) {
      event?.preventDefault?.();
      
      handleSessionUpdate(
        `Results ${action}ed successfully.`,
        toggleResultsAPI(sessionId, newResultsPublished)
      );
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const endedSessions = sessions.filter(s => s.status !== 'active');

  return (
    <div className="admin-manage-page p-4">
      <header className="sticky-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="mdb-header-1" style={{margin: 0}}>Admin Session Management</h1>
          <button onClick={handleRefreshSessions} className="mdb-btn mdb-btn-secondary mdb-btn-small">
            Refresh Sessions
          </button>
        </div>
      </header>

      {error && <p className="mdb-message mdb-message-error mb-3">{error}</p>}
      {successMessage && <p className="mdb-message mdb-message-success mb-3">{successMessage}</p>}

      {loading && !sessions.length && <div className="mdb-spinner"></div>}

      {!loading && (
        <SessionCreateForm 
          fetchSessions={fetchAllSessionsData} 
          setError={setError} 
          setSuccessMessage={setSuccessMessage} 
        />
      )}

      <div className="admin-grid-layout">
        <div className="admin-column-left">
          <div className="mongodb-card mb-4">
            <h2 className="mdb-header-2">Manage Sessions</h2>
            <h3 className="mdb-header-3">Active Sessions</h3>
            {activeSessions.length > 0 ? (
              <SessionList 
                sessions={activeSessions}
                onSelectSession={handleSelectSession}
                onEndSession={handleEndSession}
                onDeleteSession={handleDeleteSession}
                isActiveList={true}
              />
            ) : (
              <p>No active sessions.</p>
            )}

            <h3 className="mdb-header-3 mt-4">Ended/Archived Sessions</h3>
            {endedSessions.length > 0 ? (
              <SessionList 
                sessions={endedSessions}
                onSelectSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                isActiveList={false}
              />
            ) : (
              <p>No ended sessions.</p>
            )}
          </div>
        </div>

        <div className="admin-column-right">
          {selectedSessionFull ? (
            loadingDetails ? (
              <div className="mongodb-card"><div className="mdb-spinner"></div></div>
            ) : (
              <SessionDetailView 
                session={selectedSessionFull}
                teams={teams} 
                submissionsCount={submissions.length} 
                actualSubmissionsCount={actualSubmissionsCount} 
                totalVotesCast={totalVotesCast} 
                onToggleSubmission={handleToggleSubmission}
                onToggleVoting={handleToggleVoting}
                onToggleResults={handleToggleResults}
                onDeleteSessionGlobal={handleDeleteSession}
                onEndSessionGlobal={handleEndSession}
                loadingTeams={loadingDetails && !teams.length} 
                loadingSubmissions={loadingDetails && !submissions.length} 
              />
            )
          ) : (
            <div className="mongodb-card text-center">
              <h3 className="mdb-header-3">Select a session to view details</h3>
              <p className="mdb-text-color-light">Session details, teams, and voting statistics will appear here once a session is selected from the list on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminManage;
