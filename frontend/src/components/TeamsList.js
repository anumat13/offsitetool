import React, { useState, useEffect } from 'react';
import { fetchSessionTeamsAPI } from '../services/adminApi'; // Updated path
import '../styles/mongodb-theme.css';

function TeamsList({ sessionId }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!sessionId) {
            setLoading(false);
            return;
        }

        const loadTeams = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchSessionTeamsAPI(sessionId);
                setTeams(data.teams || []);
            } catch (err) {
                setError(err.message || 'Failed to load teams.');
                setTeams([]);
            }
            setLoading(false);
        };

        loadTeams();
    }, [sessionId]);

    if (loading) {
        return <div className="mdb-spinner mdb-spinner-small"></div>;
    }

    if (error) {
        return <p className="mdb-message mdb-message-error">{error}</p>;
    }

    if (teams.length === 0) {
        return <p className="mdb-text-color-light">No teams found for this session.</p>;
    }

    return (
        <div className="teams-container">
            {teams.map(team => (
                <div 
                    key={team._id} 
                    className="team-card" 
                    style={{
                        backgroundColor: 'var(--mdb-background-color)',
                        border: '1px solid var(--mdb-border-color)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '16px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    <h4 className="team-name" style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: 'var(--mdb-primary-color)'
                    }}>
                        {team.teamName}
                    </h4>
                    
                    <div className="team-members" style={{ marginBottom: '12px' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>Team Members:</h5>
                        <ul style={{ paddingLeft: '20px', margin: '0' }}>
                            {team.teamMembers && team.teamMembers.map((member, index) => (
                                <li key={index} style={{ fontSize: '0.9rem' }}>{member}</li>
                            ))}
                        </ul>
                    </div>
                    
                    {team.solution && (
                        <div className="team-solution">
                            <h5 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>Product/Solution:</h5>
                            <p style={{ 
                                padding: '8px', 
                                backgroundColor: 'var(--mdb-primary-color-light)', 
                                borderRadius: '4px',
                                fontSize: '0.9rem'
                            }}>
                                {team.solution}
                            </p>
                        </div>
                    )}
                    
                    <div className="team-meta" style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px',
                        marginTop: '12px',
                        fontSize: '0.8rem',
                        color: 'var(--mdb-text-color-light)'
                    }}>
                        {team.personaCard && (
                            <span className="meta-tag" style={{
                                backgroundColor: 'var(--mdb-success-color-light)',
                                color: 'var(--mdb-success-color-dark)',
                                padding: '2px 8px',
                                borderRadius: '12px'
                            }}>
                                Persona: {team.personaCard}
                            </span>
                        )}
                        {team.mdbCardUsed && (
                            <span className="meta-tag" style={{
                                backgroundColor: 'var(--mdb-primary-color-light)',
                                color: 'var(--mdb-primary-color)',
                                padding: '2px 8px',
                                borderRadius: '12px'
                            }}>
                                MongoDB: {team.mdbCardUsed}
                            </span>
                        )}
                        {team.aiCardUsed && (
                            <span className="meta-tag" style={{
                                backgroundColor: 'var(--mdb-info-color-light)',
                                color: 'var(--mdb-info-color-dark)',
                                padding: '2px 8px',
                                borderRadius: '12px'
                            }}>
                                AI: {team.aiCardUsed}
                            </span>
                        )}
                        <span className="meta-tag" style={{
                            backgroundColor: 'var(--mdb-warning-color-light)',
                            color: 'var(--mdb-warning-text-color)',
                            padding: '2px 8px',
                            borderRadius: '12px'
                        }}>
                            Votes: {team.totalVotes || 0}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TeamsList;
