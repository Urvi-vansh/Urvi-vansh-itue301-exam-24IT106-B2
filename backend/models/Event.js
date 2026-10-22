import mongoose from 'mongoose';

function addPublicId(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}

const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Event title is required.'], trim: true },
  category: { type: String, trim: true },
  date: { type: Date, required: [true, 'Event date is required.'] },
  venue: { type: String, required: [true, 'Venue is required.'], trim: true },
  ticketsAvailable: { type: Number, min: [0, 'Available tickets cannot be negative.'], default: 0 },
}, { timestamps: true, toJSON: { transform: addPublicId } });

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
