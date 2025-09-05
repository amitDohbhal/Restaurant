//asd
import mongoose from 'mongoose';

const roomAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  roomId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomInfo',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out', 'reserved'],
    default: 'checked-in'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for frequently queried fields
roomAccountSchema.index({ roomNumber: 1, status: 1 });
roomAccountSchema.index({ email: 1 });

// Check if the model has already been defined
const RoomAccount = mongoose.models.RoomAccount || mongoose.model('RoomAccount', roomAccountSchema);

export default RoomAccount;