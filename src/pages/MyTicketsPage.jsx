import React from 'react';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function MyTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function loadTickets() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/tickets/my`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Could not load your tickets.');
        setTickets(data.tickets);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message || 'Could not load your tickets.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadTickets();
    return () => controller.abort();
  }, [token]);

  return (
    <section className="page-section">
      <p className="eyebrow">YOUR EVENT LINEUP</p>
      <h2>My Tickets</h2>
      {loading && <p className="request-state" role="status">Loading your tickets…</p>}
      {!loading && error && <p className="request-error" role="alert">{error}</p>}
      {!loading && !error && (tickets.length === 0
        ? <p>You have not booked any tickets yet.</p>
        : <div className="ticket-list">{tickets.map((ticket) => {
          const event = ticket.eventId;
          return (
            <article className="ticket-entry ticket-summary" key={ticket.id}>
              <h3>{event?.title ?? 'Event unavailable'}</h3>
              {event?.date && <p>Date: {new Date(event.date).toLocaleDateString()}</p>}
              {event?.venue && <p>Venue: {event.venue}</p>}
              <p>Quantity booked: {ticket.quantity}</p>
              <p>Status: <span className="ticket-status">{ticket.status}</span></p>
              {ticket.attendeeId?.name && <p>Booked by: {ticket.attendeeId.name}</p>}
            </article>
          );
        })}</div>)}
    </section>
  );
}
