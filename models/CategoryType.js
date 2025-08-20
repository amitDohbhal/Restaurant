
const mongoose = require('mongoose');

const CategoryTypeSchema = new mongoose.Schema({
    categoryType: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.models.CategoryType || mongoose.model('CategoryType', CategoryTypeSchema);