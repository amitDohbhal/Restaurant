import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from '@/models/RoomAccount';

export async function GET() {
  try {
    await connectDB();
    const guests = await RoomAccount.find({}).sort({ checkIn: 1 });
    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Guest ID is required' },
        { status: 400 }
      );
    }

    await RoomAccount.findByIdAndDelete(id);
    return NextResponse.json(
      { success: true, message: 'Guest deleted successfully' }
    );
    
  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete guest' },
      { status: 500 }
    );
  }
}
