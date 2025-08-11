import { Schema, models, model } from "mongoose";
import bcrypt from "bcryptjs";

const SubAdminSchema = new Schema(
    {
        fullName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: true },
        isSubAdmin: { type: Boolean, default: true },
    },
    { timestamps: true }
);

SubAdminSchema.pre("save", async function (next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

export default models.SubAdmin || model("SubAdmin", SubAdminSchema);
