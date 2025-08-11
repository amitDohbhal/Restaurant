import { Schema, models, model } from "mongoose";

const CartListSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export default models.CartList || model("CartList", CartListSchema);
