import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import Chat from "@/models/Chat";

export async function POST(req) {
    await connectDB();
    const { userId, botMessages } = await req.json();
    if (!userId || !Array.isArray(botMessages)) {
        return NextResponse.json({ error: "Missing userId or botMessages" }, { status: 400 });
    }
    try {
        let chat = await Chat.findOne({ userId });
        if (!chat) {
            // If no chat exists, create one with bot messages
            chat = new Chat({
                userId,
                messages: botMessages,
                unreadCountUser: 0,
                unreadCountAdmin: 0,
            });
        } else {
            // Prepend bot messages if not already present (dedupe by createdAt/text)
            const existing = new Set(chat.messages.map(m => m.createdAt + m.text));
            const deduped = botMessages.filter(m => !existing.has(m.createdAt + m.text));
            chat.messages = [...deduped, ...chat.messages];
        }
        await chat.save();
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
