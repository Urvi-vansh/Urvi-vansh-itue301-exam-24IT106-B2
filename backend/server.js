import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Demo in-memory data. Replace with a database for persistent production data.
const attendees = [
  { id: 'attendee-1', email: 'attendee@eventhub.test', password: 'password123', name: 'Demo Attendee' },
  { id: 'organizer-1', email: 'organizer@eventhub.test', password: 'password123', name: 'Demo Organizer' },
];
const events = [
  { id: 'event-1', title: 'Summer Music Festival', category: 'Music', date: '2026-08-16', venue: 'Riverside Park', ticketsAvailable: 24 },
  { id: 'event-2', title: 'Design Futures Conference', category: 'Technology', date: '2026-09-04', venue: 'Civic Convention Center', ticketsAvailable: 0 },
  { id: 'event-3', title: 'City Food & Culture Fair', category: 'Food', date: '2026-10-10', venue: 'Market Square', ticketsAvailable: 85 },
];
const tickets = [];
const tokens = new Map();

// Runs before every route and records the request method, path, and timestamp.
function requestLogger(req, res, next) {
  console.log(`[${req.method}] [${req.path}] [${new Date().toISOString()}]`);
  next();
}

function authGuard(req, res, next) {
  const authorization = req.get('Authorization') || '';
  const [scheme, token] = authorization.split(' ');
  const attendee = scheme === 'Bearer' && token ? tokens.get(token) : null;
  if (!attendee) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid Bearer token is required.' } });
  }
  req.attendee = attendee;
  next();
}

app.use(requestLogger);
app.use(cors());
app.use(express.json());

const api = express.Router();
const auth = express.Router();
const eventRoutes = express.Router();
const ticketRoutes = express.Router();

// POST /api/v1/auth/login
// Demo credentials: attendee@eventhub.test or organizer@eventhub.test / password123
// This demo issues opaque in-memory tokens; restart clears all tokens and bookings.
auth.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required.' } });
    }
    const attendee = attendees.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
    if (!attendee) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    }
    const token = randomUUID();
    const publicAttendee = { id: attendee.id, email: attendee.email, name: attendee.name };
    tokens.set(token, publicAttendee);
    return res.status(200).json({ attendee: publicAttendee, token, role: attendee.id === 'organizer-1' ? 'organizer' : 'attendee' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events is public.
eventRoutes.get('/', (req, res) => res.status(200).json({ events }));

// All ticket endpoints require a valid token.
ticketRoutes.use(authGuard);

ticketRoutes.post('/', (req, res, next) => {
  try {
    const { eventId, quantity } = req.body ?? {};
    if (typeof eventId !== 'string' || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: { code: 'INVALID_BOOKING', message: 'eventId and a positive integer quantity are required.' } });
    }
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      return res.status(400).json({ error: { code: 'EVENT_NOT_FOUND', message: 'The requested event does not exist.' } });
    }
    if (quantity > event.ticketsAvailable) {
      return res.status(400).json({ error: { code: 'INSUFFICIENT_TICKETS', message: `Only ${event.ticketsAvailable} ticket(s) remain.` } });
    }
    event.ticketsAvailable -= quantity;
    const ticket = {
      id: randomUUID(), attendeeId: req.attendee.id, eventId: event.id,
      eventTitle: event.title, quantity, status: 'confirmed', createdAt: new Date().toISOString(),
    };
    tickets.push(ticket);
    return res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
});

ticketRoutes.get('/my', (req, res) => {
  const attendeeTickets = tickets.filter((ticket) => ticket.attendeeId === req.attendee.id);
  return res.status(200).json({ tickets: attendeeTickets });
});

ticketRoutes.patch('/:id/status', (req, res) => {
  const { status } = req.body ?? {};
  if (!['confirmed', 'cancelled', 'used'].includes(status)) {
    return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Status must be confirmed, cancelled, or used.' } });
  }
  const ticket = tickets.find((item) => item.id === req.params.id && item.attendeeId === req.attendee.id);
  if (!ticket) {
    return res.status(400).json({ error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found for this attendee.' } });
  }
  ticket.status = status;
  return res.status(200).json({ ticket });
});

api.use('/auth', auth);
api.use('/events', eventRoutes);
api.use('/tickets', ticketRoutes);
app.use('/api/v1', api);

// Return a structured 404 for unknown API routes.
app.use((req, res) => {
  res.status(400).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}.` } });
});

// Error handler is deliberately last; never expose stack traces to clients.
app.use((error, req, res, next) => {
  console.error(`[ERROR] ${error.message}`);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected server error occurred.' } });
});

app.listen(PORT, () => console.log(`EventHub API listening on http://localhost:${PORT}`));
