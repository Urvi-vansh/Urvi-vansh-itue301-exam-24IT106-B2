import EventCard from '../components/EventCard.jsx';

export default function EventsPage({ events = [], onBook }) {
  return (
    <section>
      <h2>Upcoming Events</h2>
      {events.length === 0
        ? <p>No events are available right now.</p>
        : <div>{events.map((event) => (
          <EventCard key={event.title} {...event} onBook={onBook} />
        ))}</div>}
    </section>
  );
}
