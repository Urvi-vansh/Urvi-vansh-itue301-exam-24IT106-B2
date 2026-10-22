import React from 'react';
export default function EventCard({ id, title, category, date, venue, ticketsAvailable, onBook }) {
  const event = { id, title, category, date, venue, ticketsAvailable };
  return (
    <article className="event-card">
      <h3>{title}</h3>
      <p>Category: {category}</p>
      <p>Date: {date}</p>
      <p>Venue: {venue}</p>
      <p>Tickets available: {ticketsAvailable}</p>
      {ticketsAvailable === 0
        ? <span className="sold-out-badge" role="status">Sold Out</span>
        : <button className="button button-small" type="button" onClick={() => onBook?.(event)}>Book</button>}
    </article>
  );
}

