import React from 'react';
import { useEffect, useState } from 'react';
import EventCard from '../components/EventCard.jsx';
import { API_BASE_URL } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function EventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEvents() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/events`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Could not load events (HTTP ${response.status}).`);
        const data = await response.json();
        if (!Array.isArray(data.events)) throw new Error('The events response was not in the expected format.');
        setEvents(data.events);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load events. Please try again.');
          setEvents([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadEvents();
    return () => controller.abort();
  }, []);

  const filteredEvents = events.filter((event) => event.title.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  const availableEvents = events.filter((event) => event.ticketsAvailable > 0);
  const selectedBookingEvent = availableEvents.find((event) => event.title === selectedEvent) ?? availableEvents[0];

  async function bookTickets(eventToBook, requestedQuantity) {
    setMessage('');
    setBooking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ eventId: eventToBook.id, quantity: requestedQuantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Booking failed. Please try again.');
      setEvents((current) => current.map((event) => event.id === eventToBook.id
        ? { ...event, ticketsAvailable: event.ticketsAvailable - requestedQuantity }
        : event));
      setQuantity(1);
      setMessage(`Booked ${requestedQuantity} ticket(s) for ${eventToBook.title}.`);
    } catch (bookingError) {
      setMessage(bookingError.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedBookingEvent || quantity < 1 || quantity > selectedBookingEvent.ticketsAvailable) {
      setMessage('Choose an available event and a valid ticket quantity.');
      return;
    }
    bookTickets(selectedBookingEvent, Number(quantity));
  }

  return (
    <section className="page-section events-page">
      <p className="eyebrow">DISCOVER SOMETHING NEW</p>
      <h2>Upcoming Events</h2>
      {loading && <p className="request-state" role="status">Loading events…</p>}
      {!loading && error && <p className="request-error" role="alert">{error}</p>}
      {!loading && !error && <>
        <div className="search-field">
          <label htmlFor="event-search">Search events</label>
          <input id="event-search" type="search" placeholder="Search by event title" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
        {filteredEvents.length > 0
          ? <div className="event-grid">{filteredEvents.map((event) => <EventCard key={event.id ?? event.title} {...event} onBook={(item) => { setSelectedEvent(item.title); bookTickets(item, 1); }} />)}</div>
          : <p className="request-state">{events.length ? 'No events match your search.' : 'There are no events to show.'}</p>}
        <div className="booking-panel">
          <div><p className="eyebrow">MAKE IT YOURS</p><h3>Book tickets</h3></div>
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-field"><label htmlFor="selected-event">Selected event</label>
              <select id="selected-event" value={selectedBookingEvent?.title ?? ''} onChange={(event) => setSelectedEvent(event.target.value)} required>
                {availableEvents.map((event) => <option key={event.id ?? event.title} value={event.title}>{event.title}</option>)}
              </select>
            </div>
            <div className="form-field quantity-field"><label htmlFor="quantity">Quantity</label>
              <input id="quantity" type="number" min="1" max={selectedBookingEvent?.ticketsAvailable ?? 1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />
            </div>
            <button className="button" type="submit" disabled={availableEvents.length === 0 || booking}>Book tickets <span aria-hidden="true">→</span></button>
          </form>
        </div>
        {message && <p className="booking-message" role="status">{message}</p>}
      </>}
    </section>
  );
}
