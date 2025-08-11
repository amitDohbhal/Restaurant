import { Schema, models, model } from "mongoose";

const specializationSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true }
});

export default models.Specialization || model("Specialization", specializationSchema);

// const ReviewSchema = new Schema(
//     {
//         user: { type: Schema.Types.ObjectId, ref: "User" },
//         message: { type: String },
//         rating: { type: Number },
//         packageName: { type: String },
//         packageId: { type: Schema.Types.ObjectId, ref: "Package" },
//         approved: { type: Boolean, default: false },
//     },
//     { timestamps: true }
// );

// export default models.Review || model("Review", ReviewSchema);