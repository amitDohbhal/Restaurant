import { Schema, models, model } from "mongoose";

const FaqSchema = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { 
        type: String, 
        required: true, 
        enum: ['General', 'Returns', 'Gift', 'Refunds', 'Payments', 'Shipping']
    }
}, { timestamps: true });

export default models.Faq || model("Faq", FaqSchema);