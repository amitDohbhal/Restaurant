import { Schema, models, model } from "mongoose";

const FeaturedBannerSchema = new Schema({
    buttonLink: { type: String},
    image: { url: { type: String }, key: { type: String } },
    order: { type: Number, required: true },
}, { timestamps: true });

export default models.FeaturedBanner || model("FeaturedBanner", FeaturedBannerSchema);