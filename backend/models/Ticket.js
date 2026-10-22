import mongoose from 'mongoose';

function addPublicId(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const ticketSchema = new mongoose.Schema({
  attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendee', required: [true, 'Attendee is required.'] },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: [true, 'Event is required.'] },
  quantity: { type: Number, required: [true, 'Ticket quantity is required.'], min: [1, 'Quantity must be at least one.'] },
  bookingDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['booked', 'cancelled', 'used'], default: 'booked' },
}, { timestamps: true, toJSON: { transform: addPublicId } });

ticketSchema.index({ attendeeId: 1, bookingDate: -1 });
export default mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
