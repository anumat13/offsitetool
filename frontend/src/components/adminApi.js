console.log('REACT_APP_API_BASE_URL_FROM_ENV:', process.env.REACT_APP_API_BASE_URL);
const BASE_URL = `${process.env.REACT_APP_API_BASE_URL || ''}/api/admin`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        // This scenario should ideally be handled by a global auth check or redirect
        console.error('JWT token not found');
        // Depending on app flow, you might throw an error here or let the request fail
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `API request failed with status ${response.status}`);
    }
    return data;
};

export const fetchAllSessionsAPI = async () => {
    const response = await fetch(`${BASE_URL}/sessions/all`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const createSessionAPI = async (sessionData) => {
    console.log('createSessionAPI is attempting to fetch:', `${BASE_URL}/session`);
    const response = await fetch(`${BASE_URL}/session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData)
    });
    return handleResponse(response);
};

export const fetchSessionDetailsAPI = async (sessionId) => {
    // Use the non-admin endpoint for session details
    const API_ROOT = process.env.REACT_APP_API_BASE_URL || '';
    const response = await fetch(`${API_ROOT}/api/session/${sessionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const fetchSessionTeamsAPI = async (sessionId) => {
    // Use non-admin endpoint for teams since backend only has /api/session/:sessionId/teams
    const API_ROOT = process.env.REACT_APP_API_BASE_URL || '';
    const response = await fetch(`${API_ROOT}/api/session/${sessionId}/teams`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const fetchSessionSubmissionsAPI = async (sessionId) => {
    // Use non-admin endpoint for teams since backend only has /api/session/:sessionId/teams
    const response = await fetch(`/api/session/${sessionId}/teams`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const endSessionAPI = async (sessionId) => {
    const response = await fetch(`${BASE_URL}/session/${sessionId}/end`, {
        method: 'PATCH',  // Changed from PUT to PATCH to match backend
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteSessionAPI = async (sessionId) => {
    const response = await fetch(`${BASE_URL}/session/${sessionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const deleteAllSessionsAPI = async () => {
    const response = await fetch(`${BASE_URL}/sessions/all`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const toggleSubmissionAPI = async (sessionId, open, timerDuration = 0) => {
    const requestBody = { submissionOpen: open };
    
    // Add timer duration if provided
    if (open && timerDuration > 0) {
        requestBody.timerDuration = timerDuration;
    }
    
    const response = await fetch(`${BASE_URL}/session/${sessionId}/submission`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
    });
    return handleResponse(response);
};

export const toggleVotingAPI = async (sessionId, open, timerDuration = 0) => {
    const requestBody = { votingOpen: open };
    
    // Add timer duration if provided
    if (open && timerDuration > 0) {
        requestBody.timerDuration = timerDuration;
    }
    
    const response = await fetch(`${BASE_URL}/session/${sessionId}/voting`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
    });
    return handleResponse(response);
};

export const toggleResultsAPI = async (sessionId, show) => {
    const response = await fetch(`${BASE_URL}/session/${sessionId}/results`, {
        method: 'POST',  // Changed from PUT to POST to match backend
        headers: getAuthHeaders(),
        body: JSON.stringify({ resultsPublished: show })  // Changed parameter name to match backend
    });
    return handleResponse(response);
};
