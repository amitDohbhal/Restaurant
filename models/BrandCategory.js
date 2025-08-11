import mongoose from 'mongoose';

const brandCategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    buttonLink: String,
    banner: {
        url: String,
        key: String
    },
    profileImage: {
        url: String,
        key: String
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
    }],
    brandCategory: String,
    productCategory: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.BrandCategory ||
    mongoose.model('BrandCategory', brandCategorySchema);