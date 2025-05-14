import React from 'react';
import './styles/mongodb-theme.css';

export default function Spinner({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '18px 0' }}>
      <div className="mdb-spinner" aria-label="Loading" />
      {label && <div style={{ marginTop: 10, color: '#5a5a5a', fontSize: '1.01rem' }}>{label}</div>}
    </div>
  );
}
