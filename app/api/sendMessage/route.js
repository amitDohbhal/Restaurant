import connectDB from "@/lib/connectDB";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

export async function POST(req, res) {
    try {
        await connectDB();
        const body = await req.json();
        const { sender, adminName, text, userId, images } = body;

        // Determine if message is sent by admin
        let senderValue = sender;
        if (adminName) {
            senderValue = 'admin';
        }
        const newMessage = {
            sender: senderValue,
            text,
            ...(adminName && { adminName }),
            status: "sent",
            createdAt: new Date(),
            images: images || [],
        };


        // Find chat by userId only (e-commerce user-admin chat)
        let chat = await Chat.findOne({ userId });

        if (!chat) {
            // Ensure sender is set for admin/bot/system messages
            if (!newMessage.sender && newMessage.adminName) {
                newMessage.sender = 'admin';
            }
            if (!newMessage.sender && newMessage.from === 'Bot') {
                newMessage.sender = 'bot';
            }
            chat = new Chat({
                userId,
                type: "chatbot",
                messages: [newMessage],
                unreadCountAdmin: sender !== 'admin' ? 1 : 0,
                unreadCountUser: sender === 'admin' ? 1 : 0
            });
        } else {
            chat.messages.push(newMessage);

            // Increment unread count for the recipient
            if (sender === 'admin') {
                chat.unreadCountUser += 1;
            } else {
                chat.unreadCountAdmin += 1;
            }

            chat.updatedAt = new Date();
        }
        // console.log(chat)
        await chat.save();
        // console.log("chat saved",chat)
        return NextResponse.json({
            success: true,
            message: "Message sent successfully",
            chatId: chat._id
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}