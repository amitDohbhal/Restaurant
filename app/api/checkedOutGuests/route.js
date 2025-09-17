import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import RoomAccount from '@/models/RoomAccount';

export async function GET() {
  try {
    await connectDB();
    
    // Find all guests with status 'checked-out' and sort by checkout date (newest first)
    const checkedOutGuests = await RoomAccount.find({ status: 'checked-out' })
      .sort({ checkoutDate: -1 })
      .lean();

    return NextResponse.json(checkedOutGuests);
  } catch (error) {
    console.error('Error fetching checked-out guests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checked-out guests' },
      { status: 500 }
    );
  }
}
