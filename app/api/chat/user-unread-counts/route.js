// api/chat/user-chat-counts.js
import connectDB from "@/lib/connectDB";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all chats for this user
    const chats = await Chat.find({
      userId,
      $or: [
        { type: "booking" },
        { type: "enquiry" }
      ]
    });

    // Create a map of bookingId/enquiryId to unreadCountUser
    const chatCounts = chats.reduce((acc, chat) => {
      acc[chat.bookingId] = chat.unreadCountUser || 0;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      chatCounts
    });
  } catch (error) {
    console.error("Error fetching user chat counts:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}