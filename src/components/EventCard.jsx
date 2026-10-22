export default function EventCard({ title, category, date, venue, ticketsAvailable, onBook }) {
  const event = { title, category, date, venue, ticketsAvailable };

  return (
    <article>
      <h3>{title}</h3>
      <p>Category: {category}</p>
      <p>Date: {date}</p>
      <p>Venue: {venue}</p>
      <p>Tickets available: {ticketsAvailable}</p>
      {ticketsAvailable === 0
        ? <span role="status">Sold Out</span>
        : <button type="button" onClick={() => onBook?.(event)}>Book</button>}
    </article>
  );
}
