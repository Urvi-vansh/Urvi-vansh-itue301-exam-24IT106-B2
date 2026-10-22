# EventHub Ticket Booking System

Project repository: `Urvi-vansh-itue301-exam-24IT106-B2`

## Run the React app and API

1. Install dependencies with `npm install`.
2. Start MongoDB locally, or set `MONGO_URI` to your MongoDB connection string.
3. Copy `.env.example` to `.env` and edit `MONGO_URI` if needed.
4. Start the API with `npm run server`. On its first successful start, it creates demo records if they do not already exist.
5. In another terminal, run `npm run dev` and open the Vite URL.

Demo sign-in: `attendee@eventhub.test` or `organizer@eventhub.test`, password `password123`.

## MongoDB models

- `Attendee`: required name and unique required email, plus a hashed password and role for the demo login.
- `Event`: required title/date/venue, optional category, and `ticketsAvailable` constrained to zero or more.
- `Ticket`: required attendee and event references, quantity of at least one, `bookingDate` defaulting to now, and status `booked`, `cancelled`, or `used` (default `booked`).

Ticket inventory is decremented with a conditional atomic update. The API returns a structured 400 response when a requested quantity exceeds availability. `GET /api/v1/tickets/my` populates attendee name/email and event title/date/venue.