import EventCard from '../components/EventCard.jsx';

export default function MyTicketsPage({ tickets = [] }) {
  return (
    <section>
      <h2>My Tickets</h2>
      {tickets.length === 0
        ? <p>You have not booked any tickets yet.</p>
        : <div>{tickets.map((event) => (
          <EventCard key={event.title} {...event} />
        ))}</div>}
    </section>
  );
}
