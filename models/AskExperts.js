import mongoose from 'mongoose';

const AskExpertsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  need: { type: String },
  question: { type: String, required: true },
  contactMethod: { type: String },
  queryName:{type:String},
  type: { type: String, required: true,enum:['artisan','product'] },
  artisanId:{type: mongoose.Schema.Types.ObjectId, ref: 'Artisan' },
  productId:{type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.AskExperts || mongoose.model('AskExperts', AskExpertsSchema);
