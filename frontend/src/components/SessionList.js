import React from 'react';
import SessionListItem from './SessionListItem';
import '../styles/mongodb-theme.css';

function SessionList({
    sessions,
    onSelectSession,
    onEndSession,      // Only for active sessions
    onDeleteSession,
    selectedSessionId,
}) {
    if (!sessions || sessions.length === 0) {
        return null; 
    }

    return (
        <ul className="mdb-session-list">
            {sessions.map(session => (
                <SessionListItem
                    key={session._id}
                    session={session}
                    onSelectSession={onSelectSession}
                    onEndSession={onEndSession} 
                    onDeleteSession={onDeleteSession}
                    isSelected={selectedSessionId === session._id}
                />
            ))}
        </ul>
    );
}

export default SessionList;
