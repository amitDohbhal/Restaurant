import { Schema, models, model } from "mongoose";

const HeroBannerSchema = new Schema({
    buttonLink: { type: String },
    frontImg: { url: { type: String }, key: { type: String } },
    order: { type: Number, required: true },
}, { timestamps: true });

export default models.HeroBanner || model("HeroBanner", HeroBannerSchema);