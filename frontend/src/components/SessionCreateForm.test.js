import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import SessionCreateForm from './SessionCreateForm';

// Mock the createSessionAPI function
jest.mock('../services/adminApi', () => ({
  createSessionAPI: jest.fn()
}));

import { createSessionAPI } from '../services/adminApi';

describe('SessionCreateForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates input and calls API with correct payload', async () => {
    const fetchSessions = jest.fn();
    const setError = jest.fn();
    const setSuccessMessage = jest.fn();

    createSessionAPI.mockResolvedValue({ session: { sessionName: 'Test Session' } });

    render(
      <SessionCreateForm
        fetchSessions={fetchSessions}
        setError={setError}
        setSuccessMessage={setSuccessMessage}
      />
    );

    const input = screen.getByPlaceholderText('Enter new session name');
    fireEvent.change(input, { target: { value: 'Test Session' } });
    fireEvent.click(screen.getByText('Create Session'));

    await waitFor(() => {
      expect(createSessionAPI).toHaveBeenCalledWith({ sessionName: 'Test Session' });
      expect(setSuccessMessage).toHaveBeenCalledWith(expect.stringContaining('Test Session'));
      expect(setError).not.toHaveBeenCalled();
      expect(fetchSessions).toHaveBeenCalled();
    });
  });

  it('shows error if session name is empty', async () => {
    const setError = jest.fn();
    render(<SessionCreateForm setError={setError} setSuccessMessage={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Enter new session name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Create Session'));
    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith('Session name cannot be empty.');
    });
  });

  it('shows error if API throws', async () => {
    const setError = jest.fn();
    createSessionAPI.mockRejectedValue(new Error('API failed'));
    render(<SessionCreateForm setError={setError} setSuccessMessage={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Enter new session name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Create Session'));
    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith('API failed');
    });
  });
});
