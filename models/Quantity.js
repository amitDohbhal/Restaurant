import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  key: { type: String, required: true },
});

const QuantitySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variants: [
    {
      size: String,
      color: String,
      qty: Number,
      price: Number,
      weight: Number,
      profileImage: {
        type: ImageSchema,
        default: null
      },
      subImages: {
        type: [ImageSchema],
        default: []
      },
      optional: Boolean
    }
  ],
}, { timestamps: true });

export default mongoose.models.Quantity || mongoose.model('Quantity', QuantitySchema);
