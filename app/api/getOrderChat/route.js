import connectDB from "@/lib/connectDB";
import OrderChat from "@/models/OrderChat";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const orderId = searchParams.get("orderId");
    if (!userId || !orderId) {
      return NextResponse.json({ error: "Missing userId or orderId" }, { status: 400 });
    }
    const chat = await OrderChat.findOne({ userId, orderId });
    return NextResponse.json({ messages: chat?.messages || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
