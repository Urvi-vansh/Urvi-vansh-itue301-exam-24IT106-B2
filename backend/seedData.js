import bcrypt from 'bcryptjs';
import Attendee from './models/Attendee.js';
import Event from './models/Event.js';

export async function seedDemoData() {
  const demoAttendees = [
    { name: 'Demo Attendee', email: 'attendee@eventhub.test', role: 'attendee' },
    { name: 'Demo Organizer', email: 'organizer@eventhub.test', role: 'organizer' },
  ];
  const passwordHash = await bcrypt.hash('password123', 10);
  for (const attendee of demoAttendees) {
    await Attendee.updateOne(
      { email: attendee.email },
      { $setOnInsert: { ...attendee, passwordHash } },
      { upsert: true },
    );
  }

  const demoEvents = [
    { title: 'Summer Music Festival', category: 'Music', date: '2026-08-16', venue: 'Riverside Park', ticketsAvailable: 24 },
    { title: 'Design Futures Conference', category: 'Technology', date: '2026-09-04', venue: 'Civic Convention Center', ticketsAvailable: 0 },
    { title: 'City Food & Culture Fair', category: 'Food', date: '2026-10-10', venue: 'Market Square', ticketsAvailable: 85 },
  ];
  for (const event of demoEvents) {
    await Event.updateOne({ title: event.title }, { $setOnInsert: event }, { upsert: true });
  }
  console.log('Demo attendees and events are ready.');
}
