import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminNav() {
  const linkStyle = {
    color: 'white',
    marginRight: 16,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 16,
    padding: '2px 8px',
    borderRadius: 4,
    transition: 'background 0.2s',
  };
  const hoverStyle = {
    background: 'rgba(255,255,255,0.15)'
  };
  // Inline hover workaround
  const [hovered, setHovered] = React.useState("");
  const links = [
    { to: '/admin/manage', label: 'Admin Manage' },
    { to: '/admin/login', label: 'Logout' }
  ];
  return (
    <nav style={{ marginBottom: 16 }}>
      {links.map(link => (
        <Link
          key={link.to}
          to={link.to}
          style={hovered === link.to ? { ...linkStyle, ...hoverStyle } : linkStyle}
          onMouseEnter={() => setHovered(link.to)}
          onMouseLeave={() => setHovered("")}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
