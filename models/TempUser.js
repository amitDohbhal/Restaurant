import mongoose from 'mongoose';

const TempUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '30m' }, // Automatically delete after 10 minutes
});

const TempUser = mongoose.models.TempUser || mongoose.model('TempUser', TempUserSchema);

export default TempUser;