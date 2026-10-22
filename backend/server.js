import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { seedDemoData } from './seedData.js';
import Attendee from './models/Attendee.js';
import Event from './models/Event.js';
import Ticket from './models/Ticket.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const tokens = new Map();

function requestLogger(req, res, next) {
  console.log(`[${req.method}] [${req.path}] [${new Date().toISOString()}]`);
  next();
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

const authGuard = asyncHandler(async (req, res, next) => {
  const authorization = req.get('Authorization') || '';
  const [scheme, token] = authorization.split(' ');
  const attendeeId = scheme === 'Bearer' && token ? tokens.get(token) : null;
  if (!attendeeId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'A valid Bearer token is required.' } });
  }
  const attendee = await Attendee.findById(attendeeId);
  if (!attendee) {
    tokens.delete(token);
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'The attendee for this token no longer exists.' } });
  }
  req.attendee = attendee;
  next();
});

app.use(requestLogger);
app.use(cors());
app.use(express.json());

const api = express.Router();
const auth = express.Router();
const eventRoutes = express.Router();
const ticketRoutes = express.Router();

// POST /api/v1/auth/login
// Demo credentials are seeded on startup: attendee@eventhub.test or organizer@eventhub.test / password123.
auth.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required.' } });
  }
  const attendee = await Attendee.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  const passwordMatches = attendee && await bcrypt.compare(password, attendee.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
  }
  const token = randomUUID();
  tokens.set(token, attendee.id);
  return res.status(200).json({
    attendee: { id: attendee.id, email: attendee.email, name: attendee.name },
    token,
    role: attendee.role,
  });
}));

// Public event listing.
eventRoutes.get('/', asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ date: 1 });
  return res.status(200).json({ events });
}));

// Every ticket endpoint is protected.
ticketRoutes.use(authGuard);

ticketRoutes.post('/', asyncHandler(async (req, res) => {
  const { eventId, quantity } = req.body ?? {};
  if (typeof eventId !== 'string' || !mongoose.isValidObjectId(eventId) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: { code: 'INVALID_BOOKING', message: 'A valid eventId and a positive integer quantity are required.' } });
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(400).json({ error: { code: 'EVENT_NOT_FOUND', message: 'The requested event does not exist.' } });
  }
  if (event.ticketsAvailable < quantity) {
    return res.status(400).json({ error: { code: 'INSUFFICIENT_TICKETS', message: `Only ${event.ticketsAvailable} ticket(s) remain for this event.` } });
  }

  // Atomically check and decrement to avoid overselling when requests overlap.
  const updatedEvent = await Event.findOneAndUpdate(
    { _id: eventId, ticketsAvailable: { $gte: quantity } },
    { $inc: { ticketsAvailable: -quantity } },
    { new: true, runValidators: true },
  );
  if (!updatedEvent) {
    const currentEvent = await Event.findById(eventId).select('ticketsAvailable');
    const remaining = currentEvent?.ticketsAvailable ?? 0;
    return res.status(400).json({ error: { code: 'INSUFFICIENT_TICKETS', message: `Only ${remaining} ticket(s) remain for this event.` } });
  }

  try {
    const [ticket] = await Ticket.create([{
      attendeeId: req.attendee._id,
      eventId: updatedEvent._id,
      quantity,
    }]);
    await ticket.populate('eventId', 'title date venue');
    return res.status(201).json({ ticket });
  } catch (error) {
    // Restore inventory if ticket validation or persistence fails after decrement.
    await Event.findByIdAndUpdate(eventId, { $inc: { ticketsAvailable: quantity } });
    throw error;
  }
}));

ticketRoutes.get('/my', asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ attendeeId: req.attendee._id })
    .populate('attendeeId', 'name email')
    .populate('eventId', 'title date venue')
    .sort({ bookingDate: -1 });
  return res.status(200).json({ tickets });
}));

ticketRoutes.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body ?? {};
  if (!['booked', 'cancelled', 'used'].includes(status)) {
    return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Status must be booked, cancelled, or used.' } });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: { code: 'TICKET_NOT_FOUND', message: 'The ticket ID is invalid.' } });
  }
  const ticket = await Ticket.findOneAndUpdate(
    { _id: req.params.id, attendeeId: req.attendee._id },
    { $set: { status } },
    { new: true, runValidators: true },
  ).populate('attendeeId', 'name email').populate('eventId', 'title date venue');
  if (!ticket) {
    return res.status(400).json({ error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found for this attendee.' } });
  }
  return res.status(200).json({ ticket });
}));

api.use('/auth', auth);
api.use('/events', eventRoutes);
api.use('/tickets', ticketRoutes);
app.use('/api/v1', api);

app.use((req, res) => {
  res.status(400).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}.` } });
});

// Last middleware: convert Mongoose and request errors into safe JSON.
app.use((error, req, res, next) => {
  console.error(`[ERROR] ${error.name}: ${error.message}`);
  if (res.headersSent) return next(error);
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000 || error.type === 'entity.parse.failed') {
    const message = error.name === 'ValidationError'
      ? Object.values(error.errors).map((item) => item.message).join(' ')
      : error.name === 'CastError'
        ? 'A supplied ID or value has an invalid format.'
        : error.code === 11000
          ? 'A record with this value already exists.'
          : 'Request body must contain valid JSON.';
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
  }
  return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected server error occurred.' } });
});

async function start() {
  try {
    await connectDB();
    await seedDemoData();
    app.listen(PORT, () => console.log(`EventHub API listening on http://localhost:${PORT}`));
  } catch (error) {
    console.error(`EventHub API failed to start: ${error.message}`);
    process.exit(1);
  }
}

start();
