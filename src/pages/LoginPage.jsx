import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      await login(data.get('email'), data.get('password'));
      navigate('/events');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="login-layout">
      <div className="login-intro">
        <p className="eyebrow">YOUR NEXT GREAT NIGHT OUT</p>
        <h2>Find your<br /><span>people &amp; places.</span></h2>
        <p>Discover events worth showing up for, then keep every ticket in one place.</p>
        <div className="intro-mark" aria-hidden="true">✳</div>
      </div>
      <div className="login-card">
        <p className="eyebrow">WELCOME TO EVENTHUB</p>
        <h2>Sign in</h2>
        <p className="muted-copy">Pick up where the good times begin.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div>
          <div className="form-field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required /></div>
          <button className="button login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : <>Continue <span aria-hidden="true">→</span></>}</button>
        </form>
        {error && <p className="request-error" role="alert">{error}</p>}
        <p className="demo-note">Demo: attendee@eventhub.test or organizer@eventhub.test · password123</p>
      </div>
    </section>
  );
}
