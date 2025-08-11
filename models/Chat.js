import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: String,
  adminName: String,
  text: String,
  status: String,
  createdAt: Date,
  images: [{ url: { type: String }, key: { type: String } }], // updated field
});

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  type: { type: String, default: "chatbot" }, // Add type field for chat type

  messages: [messageSchema],
  unreadCountUser: { type: Number, default: 0 }, // Count for user
  unreadCountAdmin: { type: Number, default: 0 }, // Count for admin
  lastReadUser: { type: Date, default: Date.now },
  lastReadAdmin: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Chat || mongoose.model("Chat", chatSchema);
