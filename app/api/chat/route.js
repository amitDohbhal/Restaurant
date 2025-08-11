import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Chat from '@/models/Chat';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'user';
    
    // For now, return an empty array if no chats exist
    // You'll need to implement the actual chat fetching logic
    return NextResponse.json({ 
      success: true, 
      chats: [] 
    });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Create a new chat - implement your chat creation logic here
    const newChat = new Chat({
      type: body.type || 'user',
      participants: body.participants || [],
      orderId: body.orderId || null,
      lastMessage: null,
    });
    
    await newChat.save();
    
    return NextResponse.json({ 
      success: true, 
      chat: newChat 
    });

  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}