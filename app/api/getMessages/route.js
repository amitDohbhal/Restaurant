import connectDB from "@/lib/connectDB";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await connectDB();

        // Extract query parameters from the request URL
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId query parameter" },
                { status: 400 }
            );
        }
        // Find the chat in the database by userId
        const chat = await Chat.findOne({ userId }).populate("userId");
        if (!chat) {
            return NextResponse.json(
                { error: "Chat not found" },
                { status: 404 }
            );
        }
        // Return the chat messages
        return NextResponse.json({ messages: chat.messages }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}