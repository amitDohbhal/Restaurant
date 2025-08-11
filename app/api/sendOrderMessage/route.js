import connectDB from "@/lib/connectDB";
import OrderChat from "@/models/OrderChat";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { sender, adminName, text, userId, orderId, images } = body;

    if (!userId || !orderId || !sender || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMessage = {
      sender,
      text,
      ...(adminName && { adminName }),
      status: "sent",
      createdAt: new Date(),
      images: images || [],
    };

    let chat = await OrderChat.findOne({ userId, orderId });

    if (!chat) {
      chat = new OrderChat({
        userId,
        orderId,
        messages: [newMessage],
        unreadCountAdmin: sender !== 'admin' ? 1 : 0,
        unreadCountUser: sender === 'admin' ? 1 : 0
      });
    } else {
      chat.messages.push(newMessage);
      if (sender === 'admin') {
        chat.unreadCountUser += 1;
      } else {
        chat.unreadCountAdmin += 1;
      }
    }
    await chat.save();
    return NextResponse.json({ success: true, messages: chat.messages });
  } catch (err) {
    console.error("sendOrderMessage error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
