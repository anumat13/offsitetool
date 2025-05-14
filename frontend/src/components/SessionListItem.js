import React from 'react';
import '../styles/mongodb-theme.css';

function SessionListItem({
    session,
    onSelectSession,
    onEndSession,       // Will be undefined if not applicable (e.g., for ended sessions)
    onDeleteSession,
    isSelected
}) {
    const itemClassName = `mdb-session-item ${isSelected ? 'selected' : ''}`;
    const isActive = session.isActive !== false;
    
    // Status badge styling
    const statusBadge = (
        <span 
            className={`status-badge ${isActive ? 'active' : 'ended'}`}
            style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginLeft: '8px',
                backgroundColor: isActive ? 'var(--mdb-success-color-light)' : 'var(--mdb-warning-color-light)',
                color: isActive ? 'var(--mdb-success-color-dark)' : 'var(--mdb-warning-text-color)'
            }}
        >
            {isActive ? 'ACTIVE' : 'ENDED'}
        </span>
    );

    return (
        <li 
            className={itemClassName}
            onClick={() => onSelectSession(session)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: '1px solid var(--mdb-border-color)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
            }}
        >
            <div className="session-header" style={{ marginBottom: '8px' }}>
                <span className="session-name" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                    {session.sessionName}
                    {statusBadge}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--mdb-text-color-light)', marginTop: '4px' }}>
                    ID: {session._id}
                </div>
            </div>
            
            <div className="session-actions d-flex gap-2" style={{ marginTop: '8px' }}>
                {onEndSession && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); // Prevent li onClick from firing
                            onEndSession(session._id);
                        }}
                        className="mdb-btn mdb-btn-small mdb-btn-warning"
                    >
                        End Session
                    </button>
                )}
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); // Prevent li onClick from firing
                        onDeleteSession(session._id);
                    }}
                    className="mdb-btn mdb-btn-small mdb-btn-destructive-outline"
                >
                    Delete Session
                </button>
            </div>
        </li>
    );
}

export default SessionListItem;
