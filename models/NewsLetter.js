import mongoose from 'mongoose';

const NewsLetterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.NewsLetter || mongoose.model('NewsLetter', NewsLetterSchema);
