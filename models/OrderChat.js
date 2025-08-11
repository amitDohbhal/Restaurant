import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: String,
  adminName: String,
  text: String,
  status: String,
  createdAt: Date,
  images: [{ url: { type: String }, key: { type: String } }],
});

const orderChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, required: true }, // instead of ObjectId
  messages: [messageSchema],
  unreadCountUser: { type: Number, default: 0 },
  unreadCountAdmin: { type: Number, default: 0 },
  lastReadUser: { type: Date, default: Date.now },
  lastReadAdmin: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.OrderChat || mongoose.model("OrderChat", orderChatSchema);
