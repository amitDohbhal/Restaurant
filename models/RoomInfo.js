import { Schema, models, model } from "mongoose";

const RoomInfoSchema = new Schema({
    RoomNo: { type: String, required: true },
    type: { type: String, required: true },
    active: { type: Boolean, default: true },
    isBooked: { type: Boolean, default: false },
}, { timestamps: true });

export default models.RoomInfo || model("RoomInfo", RoomInfoSchema);