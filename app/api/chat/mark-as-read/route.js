import connectDB from "@/lib/connectDB";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
      await connectDB();
      const { type, bookingId, userId, isAdmin } = await req.json();

      const updateFields = {};
      if (isAdmin) {
          updateFields.unreadCountAdmin = 0;
          updateFields.lastReadAdmin = new Date();
      } else {
          updateFields.unreadCountUser = 0;
          updateFields.lastReadUser = new Date();
      }

      const chat = await Chat.findOneAndUpdate(
          { type, bookingId, userId },
          { $set: updateFields },
          { new: true }
      );

      if (!chat) {
          return NextResponse.json(
              { success: false, message: "Chat not found" },
              { status: 404 }
          );
      }

      return NextResponse.json({ success: true });
  } catch (error) {
      console.error("Error marking messages as read:", error);
      return NextResponse.json(
          { success: false, message: error.message },
          { status: 500 }
      );
  }
}