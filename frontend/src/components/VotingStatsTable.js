import React, { useState, useEffect, useRef } from 'react';
import { fetchSessionTeamsAPI } from '../services/adminApi';
import '../styles/mongodb-theme.css';

function VotingStatsTable({ sessionId }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollingIntervalRef = useRef(null);

  // Function to load teams and session data
  const loadTeamsAndSession = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      // Fetch teams data
      const teamsData = await fetchSessionTeamsAPI(sessionId);
      
      // Fetch session data to check voting status
      const sessionResponse = await fetch(`/api/session/${sessionId}`);
      const sessionData = await sessionResponse.json();
      setSession(sessionData.session);
      
      // Sort teams by votes (highest first)
      const sortedTeams = (teamsData.teams || []).sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
      setTeams(sortedTeams);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load team data.');
      setTeams([]);
    }
    if (showLoading) setLoading(false);
  };

  // Initial load effect
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Load data immediately
    loadTeamsAndSession();

    // Clean up any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Set up polling if auto-refresh is enabled
    if (autoRefresh) {
      pollingIntervalRef.current = setInterval(() => {
        loadTeamsAndSession(false); // Don't show loading indicator for automatic refreshes
      }, 5000); // Refresh every 5 seconds
    }

    // Clean up on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionId, autoRefresh]);

  if (loading) {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: '20px' }}>
        <div className="mdb-spinner mdb-spinner-small" style={{ margin: '0 auto 16px auto' }}></div>
        <p style={{ color: 'var(--mdb-text-color-light)' }}>Loading team information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{
        padding: '16px',
        backgroundColor: 'var(--mdb-destructive-color-light)',
        borderRadius: '8px',
        border: '1px solid var(--mdb-destructive-color)',
        marginBottom: '16px'
      }}>
        <h4 style={{ color: 'var(--mdb-destructive-color)', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
          Error Loading Data
        </h4>
        <p style={{ margin: '0' }}>{error}</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div>
        <div className="refresh-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button 
            onClick={() => loadTeamsAndSession()} 
            className="mdb-btn mdb-btn-small mdb-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fas fa-sync-alt"></i> Refresh Now
          </button>
          <div className="auto-refresh-toggle">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={() => setAutoRefresh(!autoRefresh)} 
              />
              Auto-refresh
            </label>
          </div>
        </div>
        <div className="empty-state" style={{ textAlign: 'center', padding: '30px 0' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--mdb-primary-color-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <i className="fas fa-users" style={{ fontSize: '24px', color: 'var(--mdb-primary-color)' }}></i>
          </div>
          <h4 style={{ color: 'var(--mdb-text-color)', marginBottom: '8px' }}>No Teams Yet</h4>
          <p style={{ color: 'var(--mdb-text-color-light)', maxWidth: '400px', margin: '0 auto' }}>
            Teams will appear here once they have been created and submitted solutions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="refresh-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="last-updated" style={{ fontSize: '0.85rem', color: 'var(--mdb-text-color-light)' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => loadTeamsAndSession()} 
            className="mdb-btn mdb-btn-small mdb-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fas fa-sync-alt"></i> Refresh Now
          </button>
          <div className="auto-refresh-toggle">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={() => setAutoRefresh(!autoRefresh)} 
              />
              Auto-refresh
            </label>
          </div>
        </div>
      </div>

      <div className="teams-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {teams.map((team, idx) => {
          const isWinner = session && session.resultsPublished && idx === 0;
          
          return (
            <div 
              key={team._id} 
              className="team-card" 
              style={{ 
                position: 'relative',
                border: isWinner ? '2px solid var(--mdb-success-color)' : '1px solid var(--mdb-border-color)',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: isWinner ? 'var(--mdb-success-color-light)' : 'white'
              }}
            >
              {isWinner && session && session.resultsPublished && (
                <div 
                  className="winner-badge"
                  style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    backgroundColor: 'var(--mdb-success-color)',
                    color: 'white',
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderBottomLeftRadius: '8px'
                  }}
                >
                  WINNER
                </div>
              )}
              
              <div className="team-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h5 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    margin: '0 0 4px 0',
                    color: isWinner ? 'var(--mdb-success-color-dark)' : 'var(--mdb-primary-color)'
                  }}>
                    {team.teamName || 'Unnamed Team'}
                  </h5>
                  
                  {team.productTitle && (
                    <h6 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '500', 
                      margin: '0 0 4px 0',
                      color: isWinner ? 'var(--mdb-success-color-dark)' : 'var(--mdb-text-color)'
                    }}>
                      Product: {team.productTitle}
                    </h6>
                  )}
                </div>
                
                <div 
                  className="vote-count"
                  style={{
                    backgroundColor: isWinner ? 'var(--mdb-success-color)' : 'var(--mdb-primary-color)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}
                >
                  {team.totalVotes || 0}
                </div>
              </div>
              
              {/* Cards Used Section - Moved above Product/Solution */}
              <div className="team-meta" style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px',
                marginBottom: '12px',
                fontSize: '0.8rem'
              }}>
                {team.personaCard && (
                  <span className="meta-tag" style={{
                    backgroundColor: isWinner ? 'rgba(255,255,255,0.7)' : 'var(--mdb-success-color-light)',
                    color: 'var(--mdb-success-color-dark)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Persona: {team.personaCard}
                  </span>
                )}
                {team.mdbCardUsed && (
                  <span className="meta-tag" style={{
                    backgroundColor: isWinner ? 'rgba(255,255,255,0.7)' : 'var(--mdb-primary-color-light)',
                    color: 'var(--mdb-primary-color)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    MongoDB: {team.mdbCardUsed}
                  </span>
                )}
                {team.aiCardUsed && (
                  <span className="meta-tag" style={{
                    backgroundColor: isWinner ? 'rgba(255,255,255,0.7)' : 'var(--mdb-info-color-light)',
                    color: 'var(--mdb-info-color-dark)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    AI: {team.aiCardUsed}
                  </span>
                )}
                {team.wildCardUsed && (
                  <span className="meta-tag" style={{
                    backgroundColor: isWinner ? 'rgba(255,255,255,0.7)' : 'var(--mdb-warning-color-light)',
                    color: 'var(--mdb-warning-text-color)',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    Wild Card: {team.wildCardUsed}
                  </span>
                )}
              </div>
              
              {/* Team Members Section */}
              {team.teamMembers && team.teamMembers.length > 0 && (
                <div className="team-members" style={{ marginBottom: '12px' }}>
                  <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px', color: isWinner ? 'var(--mdb-success-color-dark)' : 'inherit' }}>
                    Team Members:
                  </h6>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {team.teamMembers.map((member, idx) => (
                      <span 
                        key={idx}
                        style={{
                          backgroundColor: isWinner ? 'rgba(255,255,255,0.7)' : 'var(--mdb-background-color)',
                          border: '1px solid var(--mdb-border-color)',
                          borderRadius: '16px',
                          padding: '2px 8px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Product/Solution Section */}
              {team.solution && (
                <div className="product-solution" style={{ marginBottom: '12px' }}>
                  <h6 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px', color: isWinner ? 'var(--mdb-success-color-dark)' : 'inherit' }}>
                    Solution:
                  </h6>
                  <p style={{ 
                    padding: '8px', 
                    backgroundColor: isWinner ? 'rgba(255,255,255,0.5)' : 'var(--mdb-primary-color-light)', 
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    margin: '0',
                    whiteSpace: 'pre-line'
                  }}>
                    {team.solution}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VotingStatsTable;
