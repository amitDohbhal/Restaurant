import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: { type: String, required: true, unique: true, trim: true },
  firstTitle: { type: String, trim: true },
  imageFirst: {
    url: String,
    key: String
  },
  bannerImage: {
    url: String,
    key: String
  },
  secondTitle: { type: String, trim: true },
  shortPara: { type: String, trim: true },
  thirdTitle: { type: String, trim: true },
  thirdPara: { type: String, trim: true },
  videoUrl: { type: String, trim: true },
  ifAccording: [
    {
      title: { type: String, trim: true },
      description: { type: String, trim: true }
    }
  ],
  mainProfileImage: {
    url: String,
    key: String
  },
  imageGallery: [
    {
      url: String,
      key: String
    }
  ],
  longPara: { type: String, trim: true },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
