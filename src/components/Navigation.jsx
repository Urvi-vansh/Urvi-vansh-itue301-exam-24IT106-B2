import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navigation() {
  const { attendee, role, logout } = useAuth();
  return (
    <nav className="main-nav" aria-label="Main navigation">
      <Link className="nav-link" to="/">Login</Link>
      <Link className="nav-link" to="/events">Events</Link>
      <Link className="nav-link" to="/my-tickets">My Tickets</Link>
      <Link className="nav-link" to="/organizer">Organizer</Link>
      {attendee && <><span className="nav-account">{attendee.name} · {role}</span><button className="button button-quiet" type="button" onClick={logout}>Log out</button></>}
    </nav>
  );
}

