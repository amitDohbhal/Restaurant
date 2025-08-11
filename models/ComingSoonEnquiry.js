import mongoose from "mongoose";
const ComingSoonEnquirySchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: "ComingSoon", required: true },
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  address: String,
  adults: Number,
  children: Number,
  infants: Number,
  travelDate: Date,
  startFrom: String,
  whichLocation: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.models.ComingSoonEnquiry || mongoose.model("ComingSoonEnquiry", ComingSoonEnquirySchema);
