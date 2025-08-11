import { Schema, models, model } from "mongoose";

const BrandSchema = new Schema({
    slug: { type: String, unique: true },
    buttonLink: { type: String },
    frontImg: { url: { type: String }, key: { type: String } },
    banner: { url: { type: String }, key: { type: String } },
    profileImage: { url: { type: String }, key: { type: String } },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

export default models.Brand || model("Brand", BrandSchema);