import { Schema, models, model } from "mongoose";
import bcrypt from "bcryptjs";

const AdminSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: true },
    },
    { timestamps: true }
);

AdminSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

export default models.Admin || model("Admin", AdminSchema);
