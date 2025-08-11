'use server'

import connectDB from "@/lib/connectDB";
import User from "@/models/User";

export async function GetAllUsers() {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 }).lean().exec();
    return users;
}