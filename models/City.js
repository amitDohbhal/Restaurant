import { Schema, models, model } from "mongoose";

const CitySchema = new Schema(
    {
        stateName: { type: String, required: true, unique: true },
        cities: { type: [String], default: [], lowercase: true },
    },
    { timestamps: true }
);

export default models.City || model("City", CitySchema);
