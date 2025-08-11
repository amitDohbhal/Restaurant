import connectDB from "@/lib/connectDB";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        await connectDB();

        // Get all chats where admin has unread messages
        const chats = await Chat.find({
            $or: [
                { unreadCountAdmin: { $gt: 0 } },
                { 'messages.status': 'sent' } // Optional: track undelivered messages
            ]
        });

        // Categorize by type
        const counts = chats.reduce((acc, chat) => {
            if (chat.unreadCountAdmin > 0) {
                acc[chat.type === 'booking' ? 'bookings' : 'enquiries'] += chat.unreadCountAdmin;
            }
            return acc;
        }, { bookings: 0, enquiries: 0 });

        return NextResponse.json({
            success: true,
            ...counts
        });
    } catch (error) {
        console.error("Error fetching admin unread counts:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}