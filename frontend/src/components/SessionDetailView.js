import React, { useState, useEffect } from 'react';
import TeamsList from './TeamsList';
import VotingStatsTable from './VotingStatsTable';
import '../styles/mongodb-theme.css';

function SessionDetailView({
    session, 
    teams = [], 
    submissionsCount = 0, 
    actualSubmissionsCount = 0, 
    totalVotesCast = 0, 
    onToggleSubmission,
    onToggleVoting,
    onToggleResults,
    onEndSessionGlobal,
    onDeleteSessionGlobal
}) {
    const [timerValue, setTimerValue] = useState(15); // Default timer value
    
    // Update timer value when session changes
    useEffect(() => {
        if (session && session.submissionTimerDuration) {
            setTimerValue(session.submissionTimerDuration);
        } else {
            setTimerValue(15); // Default to 15 minutes
        }
    }, [session]);
    if (!session) {
        return (
            <div className="mongodb-card text-center">
                <h3 className="mdb-header-3">No Session Selected</h3>
                <p className="mdb-text-color-light">Please select a session to see its details.</p>
            </div>
        );
    }

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString(undefined, { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit'
        });
    };

    const submissionButtonText = session.isSubmissionOpen ? 'Close Submission' : 'Open Submission';
    const submissionButtonClass = session.isSubmissionOpen ? 'mdb-btn mdb-btn-warning' : 'mdb-btn mdb-btn-primary';
    
    const votingButtonText = session.isVotingOpen ? 'Close Voting' : 'Open Voting';
    const votingButtonClass = session.isVotingOpen ? 'mdb-btn mdb-btn-warning' : 'mdb-btn mdb-btn-primary';

    const resultsButtonText = session.showResults ? 'Hide Results' : 'Show Results';
    const resultsButtonClass = session.showResults ? 'mdb-btn mdb-btn-secondary' : 'mdb-btn mdb-btn-primary';

    const totalTeams = teams.length;

    return (
        <div className="mongodb-card session-detail-view p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h2 className="mdb-header-2" style={{marginBottom: '0.25rem'}}>{session.name}</h2>
                    <p className="mdb-text-color-light">ID: {session._id}</p>
                </div>
                {session.sessionCode && (
                    <div className="session-code-display text-center p-2" 
                         style={{backgroundColor: 'var(--mdb-primary-color-light)', borderRadius: 'var(--mdb-border-radius)'}}>
                        <span className="mdb-text-color-light" style={{fontSize: '0.8rem'}}>JOIN CODE</span><br/>
                        <strong style={{fontSize: '1.5rem', color: 'var(--mdb-primary-color)'}}>{session.sessionCode}</strong>
                    </div>
                )}
            </div>
            
            <div className="row mb-3">
                <div className="col-md-6">
                    <p className="mb-1">
                        <strong>Status:</strong> 
                        <span 
                            className={`badge ${session.status === 'active' ? 'mdb-badge-success' : 'mdb-badge-danger'} ms-2`}
                            style={{
                                fontSize: '0.9rem',
                                padding: '0.5em 0.75em',
                                verticalAlign: 'middle'
                            }}
                        >
                            <i className={`fas ${session.status === 'active' ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                    </p>
                    <p className="mdb-text-color-light mb-1">Created: {formatTimestamp(session.createdAt)}</p>
                    {session.status === 'ended' && session.endedAt && (
                        <p className="mdb-text-color-light mb-1">Ended: {formatTimestamp(session.endedAt)}</p>
                    )}
                </div>
                <div className="col-md-6">
                    <h5 className="mdb-header-5 mb-2">Session Stats:</h5>
                    <p className="mdb-text-color-light mb-1">
                        <i className="fas fa-users me-2"></i>Registered Teams: <strong>{totalTeams}</strong>
                    </p>
                    <p className="mdb-text-color-light mb-1">
                        <i className="fas fa-file-alt me-2"></i>Teams Submitted: <strong>{actualSubmissionsCount}</strong> / <strong>{totalTeams}</strong>
                    </p>
                    <p className="mdb-text-color-light mb-1">
                        <i className="fas fa-vote-yea me-2"></i>Total Votes Cast: <strong>{totalVotesCast}</strong>
                    </p>
                </div>
            </div>

            {session.status === 'active' && (
                <div className="session-controls mb-4">
                    <div className="control-buttons d-flex gap-2 flex-wrap" style={{ marginBottom: '12px' }}>
                        {/* Submission Controls */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px', 
                            width: '100%', 
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: 'var(--mdb-background-color-light)',
                            borderRadius: '8px',
                            border: '1px solid var(--mdb-border-color)'
                        }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--mdb-primary-color)' }}>
                                <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
                                Team Submission Controls
                            </h4>
                            
                            {!session.isSubmissionOpen ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <button 
                                            onClick={(e) => onToggleSubmission(session._id, session.isSubmissionOpen, e, 0)}
                                            className={submissionButtonClass}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px 16px',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <i className="fas fa-unlock"></i>
                                            Open Submission
                                        </button>
                                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px', marginTop: '10px' }}>
                                        <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Set timer (minutes):</span>
                                        <input 
                                            type="number" 
                                            min="1"
                                            max="120"
                                            value={timerValue}
                                            onChange={(e) => setTimerValue(parseInt(e.target.value) || 15)}
                                            placeholder="Enter minutes"
                                            id="submissionTimerInput"
                                            style={{
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--mdb-border-color)',
                                                width: '100px'
                                            }}
                                        />
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent default form submission
                                                if (timerValue > 0) {
                                                    // For Set Timer button, we always want to open submissions with a timer
                                                    // Force submissionOpen to be true regardless of current state
                                                    onToggleSubmission(session._id, false, e, timerValue, true); // Added parameter to skip confirmation
                                                } else {
                                                    alert('Please enter a valid timer duration (minutes)');
                                                }
                                            }}
                                            className="mdb-btn mdb-btn-secondary"
                                            style={{
                                                padding: '8px 16px',
                                                marginLeft: '10px'
                                            }}
                                        >
                                            Set Timer
                                        </button>
                                    </div>
                                    </div>
                                    {/* Always show timer status */}
                                    <div style={{ 
                                        fontSize: '1rem', 
                                        color: session.submissionTimerEnabled ? 'var(--mdb-success-color-dark)' : 'var(--mdb-text-color)',
                                        backgroundColor: session.submissionTimerEnabled ? 'var(--mdb-success-color-light)' : '#f5f5f5',
                                        padding: '12px 16px',
                                        borderRadius: '4px',
                                        marginTop: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        border: session.submissionTimerEnabled ? '1px solid var(--mdb-success-color)' : '1px solid #ddd',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}>
                                        <i className={`fas fa-${session.submissionTimerEnabled ? 'check-circle' : 'clock'}`} style={{ fontSize: '1.5rem' }}></i>
                                        <div>
                                            <strong style={{ display: 'block', marginBottom: '4px' }}>
                                                {session.submissionTimerEnabled 
                                                    ? `Timer set: ${session.submissionTimerDuration} minutes` 
                                                    : 'No timer set'}
                                            </strong>
                                            <span style={{ fontSize: '0.85rem' }}>
                                                {session.submissionTimerEnabled 
                                                    ? `Timer will end at ${new Date(session.submissionTimerEndTime).toLocaleTimeString()}` 
                                                    : 'Set a timer using the input above'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={(e) => onToggleSubmission(session._id, session.isSubmissionOpen, e)}
                                    className="mdb-btn mdb-btn-warning"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className="fas fa-lock"></i>
                                    Close Submission
                                </button>
                            )}
                        </div>
                        
                        {/* Voting Controls */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px', 
                            width: '100%', 
                            marginBottom: '10px',
                            padding: '15px',
                            backgroundColor: 'var(--mdb-background-color-light)',
                            borderRadius: '8px',
                            border: '1px solid var(--mdb-border-color)'
                        }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--mdb-primary-color)' }}>
                                <i className="fas fa-vote-yea" style={{ marginRight: '8px' }}></i>
                                Voting Controls
                            </h4>
                            
                            {!session.isVotingOpen ? (
                                <button 
                                    onClick={(e) => onToggleVoting(session._id, session.isVotingOpen, e)}
                                    className={votingButtonClass}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className="fas fa-unlock"></i>
                                    Open Voting
                                </button>
                            ) : (
                                <button 
                                    onClick={(e) => onToggleVoting(session._id, session.isVotingOpen, e)}
                                    className="mdb-btn mdb-btn-warning"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 16px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className="fas fa-lock"></i>
                                    Close Voting
                                </button>
                            )}
                        </div>
                        <button 
                            onClick={(e) => onToggleResults(session._id, session.showResults, e)}
                            className={resultsButtonClass}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className={`fas fa-${session.showResults ? 'eye-slash' : 'eye'}`}></i>
                            {resultsButtonText}
                        </button>
                        <button 
                            onClick={(e) => onEndSessionGlobal(session._id, e)} 
                            className="mdb-btn mdb-btn-warning"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className="fas fa-stop-circle"></i>
                            End Session Now
                        </button>
                    </div>
                    
                    <div className="session-status-info" style={{
                        backgroundColor: 'var(--mdb-background-color-light)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '0.9rem'
                    }}>
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', marginRight: '8px' }}>Submission Status:</span>
                            <span style={{
                                backgroundColor: session.isSubmissionOpen ? 'var(--mdb-success-color-light)' : 'var(--mdb-warning-color-light)',
                                color: session.isSubmissionOpen ? 'var(--mdb-success-color-dark)' : 'var(--mdb-warning-text-color)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                {session.isSubmissionOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                            
                            {session.submissionTimerEnabled && session.submissionTimerEndTime && (
                                <span style={{
                                    backgroundColor: 'var(--mdb-primary-color-light)',
                                    color: 'var(--mdb-primary-color)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    marginLeft: '8px'
                                }}>
                                    <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                                    Timer: {new Date(session.submissionTimerEndTime).toLocaleTimeString()} ({session.submissionTimerDuration}min)
                                </span>
                            )}
                        </div>
                        
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', marginRight: '8px' }}>Voting Status:</span>
                            <span style={{
                                backgroundColor: session.isVotingOpen ? 'var(--mdb-success-color-light)' : 'var(--mdb-warning-color-light)',
                                color: session.isVotingOpen ? 'var(--mdb-success-color-dark)' : 'var(--mdb-warning-text-color)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                {session.isVotingOpen ? 'OPEN' : 'CLOSED'}
                            </span>
                            
                            {session.timerEnabled && session.timerEndTime && (
                                <span style={{
                                    backgroundColor: 'var(--mdb-primary-color-light)',
                                    color: 'var(--mdb-primary-color)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    marginLeft: '8px'
                                }}>
                                    <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                                    Timer: {new Date(session.timerEndTime).toLocaleTimeString()} ({session.timerDuration}min)
                                </span>
                            )}
                        </div>
                        
                        <div>
                            <span style={{ fontWeight: '600', marginRight: '8px' }}>Results Status:</span>
                            <span style={{
                                backgroundColor: session.showResults ? 'var(--mdb-success-color-light)' : 'var(--mdb-warning-color-light)',
                                color: session.showResults ? 'var(--mdb-success-color-dark)' : 'var(--mdb-warning-text-color)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}>
                                {session.showResults ? 'PUBLISHED' : 'HIDDEN'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="session-meta-data mb-4">
                <h4 className="mdb-header-4">Details</h4>
                <p><strong>Created:</strong> {formatTimestamp(session.createdAt)}</p>
                {session.endedAt && <p><strong>Ended:</strong> {formatTimestamp(session.endedAt)}</p>}
                {/* Add more details as available and relevant */}
            </div>

            <div className="teams-and-voting-section mb-4">
                <h3 className="mdb-header-3">Teams & Voting Results</h3>
                {session._id ? 
                    <div className="unified-team-stats">
                        {/* We'll use the VotingStatsTable component which now includes all team details with voting information */}
                        <VotingStatsTable sessionId={session._id} />
                    </div> 
                    : <p>Session ID not available for teams and voting data.</p>
                }
            </div>
            
            <div className="session-danger-zone mt-4 pt-3" style={{borderTop: '1px solid var(--mdb-border-color)'}}>
                 <h4 className="mdb-header-4" style={{color: 'var(--mdb-destructive-color)'}}>Danger Zone</h4>
                <button 
                    onClick={() => onDeleteSessionGlobal(session._id)} 
                    className="mdb-btn mdb-btn-destructive-outline"
                >
                    Delete This Session Permanently
                </button>
            </div>
        </div>
    );
}

export default SessionDetailView;
