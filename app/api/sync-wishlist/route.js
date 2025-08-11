import User from "@/models/User";
import Wishlist from "@/models/Wishlist";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { userId, wishlist } = await req.json();
    if (!userId || !Array.isArray(wishlist)) {
      return new Response(JSON.stringify({ error: "Missing userId or wishlist" }), { status: 400 });
    }
    // Find user by id or email (robust to ObjectId)
    const userQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $or: [{ _id: userId }, { email: userId }] }
      : { email: userId };
    const user = await User.findOne(userQuery);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
    user.wishlist = wishlist;
    await user.save();

    // Update Wishlist collection
    let wishlistDoc = await Wishlist.findOne({ user: user._id });
    if (!wishlistDoc) {
      wishlistDoc = new Wishlist({ user: user._id, items: wishlist });
    } else {
      wishlistDoc.items = wishlist;
    }
    await wishlistDoc.save();

    return new Response(JSON.stringify({ success: true, wishlist: user.wishlist }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
