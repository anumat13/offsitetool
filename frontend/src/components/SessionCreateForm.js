import React, { useState } from 'react';
import { createSessionAPI } from '../services/adminApi';
import '../styles/mongodb-theme.css';

function SessionCreateForm({ fetchSessions, setError, setSuccessMessage }) {
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const MAX_SESSION_NAME_LENGTH = 50;

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    const trimmedName = newSessionName.trim();

    if (!trimmedName) {
      setError('Session name cannot be empty.');
      setSuccessMessage('');
      return;
    }
    if (trimmedName.length > MAX_SESSION_NAME_LENGTH) {
      setError(`Session name cannot exceed ${MAX_SESSION_NAME_LENGTH} characters.`);
      setSuccessMessage('');
      return;
    }

    setIsCreating(true);
    setSuccessMessage('');

    try {
      const data = await createSessionAPI({ sessionName: newSessionName.trim() });
      setNewSessionName('');
      setSuccessMessage(`Session '${data.session.sessionName}' created successfully!`);
      if (fetchSessions) fetchSessions(); // Refresh the sessions list in AdminManage
    } catch (err) {
      setError(err.message || 'Could not create session');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleCreateSession} className="session-create-form">
      {/* The line below was removed as AdminManage displays the error state set by the setError prop. */}
      <div className="mdb-form-group">
        <label htmlFor="newSessionName">Session Name:</label>
        <input
          type="text"
          id="newSessionName"
          className="mdb-input"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          placeholder="Enter new session name"
          maxLength={MAX_SESSION_NAME_LENGTH + 5} // Allow typing a bit over to show error
          disabled={isCreating}
          required
        />
      </div>
      <button 
        type="submit" 
        className="mdb-btn mdb-btn-primary" 
        disabled={isCreating}
      >
        {isCreating ? 'Creating...' : 'Create Session'}
      </button>
    </form>
  );
}

export default SessionCreateForm;
