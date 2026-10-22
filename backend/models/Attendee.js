import mongoose from 'mongoose';

const attendeeSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required.'], trim: true },
  email: { type: String, required: [true, 'Email is required.'], unique: true, lowercase: true, trim: true },
  // Included for the demo login endpoint; store only a hash, never a raw password.
  passwordHash: { type: String, required: [true, 'Password is required.'], select: false },
  role: { type: String, enum: ['attendee', 'organizer'], default: 'attendee' },
}, { timestamps: true, toJSON: { transform: hideMongoFields } });

function hideMongoFields(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  delete ret.passwordHash;
  return ret;
}

export default mongoose.models.Attendee || mongoose.model('Attendee', attendeeSchema);
