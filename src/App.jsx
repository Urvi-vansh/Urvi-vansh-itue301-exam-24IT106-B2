import { useState } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import EventsPage from './pages/EventsPage.jsx';
import MyTicketsPage from './pages/MyTicketsPage.jsx';

const tickets = [
  { title: 'Summer Music Festival', category: 'Music', date: 'August 16, 2026', venue: 'Riverside Park', ticketsAvailable: 24 },
  { title: 'Design Futures Conference', category: 'Technology', date: 'September 4, 2026', venue: 'Civic Convention Center', ticketsAvailable: 0 },
  { title: 'City Food & Culture Fair', category: 'Food', date: 'October 10, 2026', venue: 'Market Square', ticketsAvailable: 85 },
];

export default function App() {
  const [page, setPage] = useState('events');
  const [bookedTickets, setBookedTickets] = useState([]);

  function bookEvent(event) {
    setBookedTickets((current) => current.some((ticket) => ticket.title === event.title)
      ? current
      : [...current, event]);
  }

  return (
    <main>
      <header>
        <h1>EventHub</h1>
        <nav aria-label="Main navigation">
          <button type="button" onClick={() => setPage('events')}>Events</button>{' '}
          <button type="button" onClick={() => setPage('tickets')}>My Tickets ({bookedTickets.length})</button>{' '}
          <button type="button" onClick={() => setPage('login')}>Log in</button>
        </nav>
      </header>
      {page === 'login' && <LoginPage />}
      {page === 'events' && <EventsPage events={tickets} onBook={bookEvent} />}
      {page === 'tickets' && <MyTicketsPage tickets={bookedTickets} />}
    </main>
  );
}
