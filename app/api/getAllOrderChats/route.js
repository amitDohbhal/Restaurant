import connectDB from "@/lib/connectDB";
import OrderChat from "@/models/OrderChat";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    // Group by userId + orderId and get last message for each thread
    const threads = await OrderChat.aggregate([
      { $unwind: "$messages" },
      { $sort: { "messages.createdAt": -1 } },
      { $group: {
        _id: { userId: "$userId", orderId: "$orderId" },
        lastMessage: { $first: "$messages" }
      }},
      { $sort: { "lastMessage.createdAt": -1 } }
    ]);
    return NextResponse.json({ threads });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
