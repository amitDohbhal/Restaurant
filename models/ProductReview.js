import mongoose from 'mongoose';

const ProductReviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
  },
  review: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
    trim: true,
  },
  image: { url: { type: String }, key: { type: String } },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ProductReview || mongoose.model('ProductReview', ProductReviewSchema);
