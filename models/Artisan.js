const mongoose = require('mongoose');

const artisanSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: true
  },
  order: { type: Number, required: true },
  title: {
    type: String,
    required: true,
    enum: ['Mr.', 'Mrs.', 'Ms.']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    required: true
  },
  specializations: [{
    type: String,
    trim: true
  }],
  artisanBanner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArtisanBanner'
  },
  contact: {
    callNumber: {
      type: String,
      required: true,
      trim: true
    },
    whatsappNumber: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  address: {
    fullAddress: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    }
  },
  profileImage: {
    url: { type: String, default: '' },
    key: { type: String, default: '' }
  },
  promotions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  }],
  artisanBlogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArtisanBlog'
  }],
  artisanStories: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story',
    default: null
  },
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArtisanCertificate'
  }],
  socialPlugin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArtisanPlugin',
    default: null
  },
}, {
  timestamps: true
});

const Artisan = mongoose.models.Artisan || mongoose.model('Artisan', artisanSchema);
export default Artisan;
export { artisanSchema };


// module.exports = mongoose.models.ArtisanBanner || mongoose.model('ArtisanBanner', ArtisanBanner);
