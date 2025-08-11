import mongoose, { Schema, model, models } from "mongoose";

const UserQuerySchema = new Schema({
  question: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String },
  userEmail: { type: String },
  status: { type: String, default: "pending" }, // pending, answered, etc
  createdAt: { type: Date, default: Date.now },
  answeredAt: { type: Date },
  answer: { type: String },
});

export default models.UserQuery || model("UserQuery", UserQuerySchema);
