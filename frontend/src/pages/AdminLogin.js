import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../components/AdminNav';

function AdminLogin() {
  React.useEffect(() => { document.title = 'Admin Login'; }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('jwtToken', data.token); // Store as 'jwtToken' for consistency
        navigate('/admin/manage'); // Redirect to the admin management page
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (err) {
      setMessage('Could not connect to backend');
    }
  };

  return (
    <div className="mongodb-theme">
      <AdminNav />
      <h2>Admin Login</h2>
      {localStorage.getItem('jwtToken') && <a href="/admin/manage" style={{ float: 'right', fontSize: 14 }}>Admin Management</a>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminLogin;
