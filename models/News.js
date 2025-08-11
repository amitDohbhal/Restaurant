import { Schema, models, model } from "mongoose";

const NewsSchema = new Schema({
    title: { type: String},
    date: { type: String},
    description: { type: String},
    image: { url: { type: String }, key: { type: String } },
    order: { type: Number, required: true },
}, { timestamps: true });

export default models.News || model("News", NewsSchema);