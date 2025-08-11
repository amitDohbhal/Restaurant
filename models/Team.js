import { Schema, models, model } from "mongoose";

const TeamSchema = new Schema({
    title: { type: String},
    designation: { type: String},
    image: { url: { type: String }, key: { type: String } },
    order: { type: Number, required: true },
}, { timestamps: true });

export default models.Team || model("Team", TeamSchema);