import connectDB from "@/lib/connectDB";
import Chat from "@/models/Chat";
import OrderChat from "@/models/OrderChat";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");

    let chats = [];
    if (type === "chatbot") {
      // User-admin chats
      const query = { type: "chatbot" };
      if (userId) query.userId = userId;
      chats = await Chat.find(query)
        .populate("userId", "name email")
        .sort({ updatedAt: -1 })
        .lean();
      // Normalize for frontend
      chats = (chats || []).map(chat => ({
        ...chat,
        _id: chat._id?.toString(),
        userId: {
          _id: chat.userId?._id?.toString(),
          name: chat.userId?.name,
          email: chat.userId?.email
        },
        userName: chat.userId?.name || "Unknown User",
        lastMessage: chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1]?.text : "No messages yet",
        lastMessageTime: chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1]?.createdAt : chat.createdAt,
        unreadCountAdmin: chat.unreadCountAdmin || 0,
        unreadCountUser: chat.unreadCountUser || 0,
        status: chat.status || "pending",
        chatStatus: chat.status || "pending",
        unreadCount: userId ? chat.unreadCountUser : chat.unreadCountAdmin
      }));
    } else if (type === "order-queries") {
      // Order-specific user-admin chats
      let orderQuery = {};
      if (userId) orderQuery.userId = userId;
      // Group by userId + orderId, get last message for each thread
      const threads = await OrderChat.aggregate([
        { $match: orderQuery },
        { $unwind: "$messages" },
        { $sort: { "messages.createdAt": -1 } },
        { $group: {
          _id: { userId: "$userId", orderId: "$orderId" },
          lastMessage: { $first: "$messages" },
          unreadCountAdmin: { $first: "$unreadCountAdmin" },
          unreadCountUser: { $first: "$unreadCountUser" },
        }},
        { $sort: { "lastMessage.createdAt": -1 } }
      ]);
      // Populate user info for each thread
      chats = await Promise.all(threads.map(async thread => {
        const user = await User.findById(thread._id.userId).select("name email").lean();
        return {
          _id: `${thread._id.userId}_${thread._id.orderId}`,
          userId: {
            _id: thread._id.userId?.toString(),
            name: user?.name,
            email: user?.email
          },
          orderId: thread._id.orderId,
          userName: user?.name || "Unknown User",
          lastMessage: thread.lastMessage?.text || "No messages yet",
          lastMessageTime: thread.lastMessage?.createdAt,
          unreadCountAdmin: thread.unreadCountAdmin || 0,
          unreadCountUser: thread.unreadCountUser || 0,
          status: thread.lastMessage?.status || "pending",
          chatStatus: thread.lastMessage?.status || "pending",
          unreadCount: userId ? thread.unreadCountUser : thread.unreadCountAdmin
        };
      }));
    }

    return NextResponse.json({
      success: true,
      chats: chats
    }, { status: 200 });
  } catch (error) {
    console.error("Error in getAllChats:", error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}