const BASE_URL = '/api/admin';

const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        // Throw an error to prevent the API call from proceeding without auth
        // This error can be caught by the calling function (e.g., createSessionAPI)
        // and then displayed to the user or trigger a redirect to login.
        throw new Error('Authentication token not found. Please log in.');
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const handleResponse = async (response) => {
    if (!response.ok) {
        // Try to get more detailed error message from response body as text
        const errorText = await response.text(); 
        // Use a more specific error or a generic one if parsing text also fails or is empty
        // For example, if the backend sends a plain text error message or an HTML page
        // We attempt to parse data.message if content-type was application/json and it still failed, 
        // but often it won't be JSON if !response.ok
        let errorMessage = `API request failed with status ${response.status}`;
        try {
            // If the error response *is* JSON with a message field
            const errorData = JSON.parse(errorText);
            if (errorData && errorData.message) {
                errorMessage = errorData.message;
            }
        } catch (e) {
            // If parsing errorText as JSON fails, use the raw errorText if it's not too long
            // or stick to the status code error.
            // This is to prevent huge HTML pages from becoming the error message.
            if (errorText && errorText.length < 500 && !errorText.toLowerCase().includes("<!doctype html")) {
                errorMessage = errorText;
            } else if (errorText.toLowerCase().includes("<!doctype html")) {
                 errorMessage = `API request failed with status ${response.status}. Server returned an HTML page. Check backend logs.`;
            }
        }
        throw new Error(errorMessage);
    }
    // If response.ok is true, then we expect JSON
    return response.json(); 
};

export const fetchAllSessionsAPI = async () => {
    const response = await fetch(`${BASE_URL}/sessions/all`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const createSessionAPI = async (sessionData) => {
    const response = await fetch(`${BASE_URL}/session`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData)
    });
    return handleResponse(response);
};

export const fetchSessionDetailsAPI = async (sessionId) => {
    // Use the non-admin endpoint for session details
    const response = await fetch(`/api/session/${sessionId}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};

export const fetchSessionTeamsAPI = async (sessionId) => {
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

export const toggleVotingAPI = async (sessionId, open) => {
    const response = await fetch(`${BASE_URL}/session/${sessionId}/voting`, {
        method: 'POST',  // Changed from PUT to POST to match backend
        headers: getAuthHeaders(),
        body: JSON.stringify({ votingOpen: open })  // Changed parameter name to match backend
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

export const toggleSubmissionAPI = async (sessionId, submissionOpen, timerDuration = 0) => {
    const response = await fetch(`${BASE_URL}/session/${sessionId}/submission`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ submissionOpen, timerDuration })
    });
    return handleResponse(response);
};

export const fetchSessionMetricsAPI = async (sessionId) => {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/metrics`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    return handleResponse(response);
};
