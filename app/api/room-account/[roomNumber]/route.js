import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import RoomAccount from '@/models/RoomAccount';

export async function GET(request, { params }) {
    try {
        const { roomNumber } = params;
        
        if (!roomNumber) {
            return NextResponse.json(
                { success: false, message: 'Room number is required' },
                { status: 400 }
            );
        }

        await connectDB();
        
        // Find the room account by room number and ensure the guest is checked in
        const roomAccount = await RoomAccount.findOne({
            roomNumber,
            status: 'checked-in'
        }).populate('unpaidRoomInvoices.invoiceId');

        if (!roomAccount) {
            return NextResponse.json(
                { success: false, message: 'No active room account found with the provided room number' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                success: true, 
                data: roomAccount 
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error fetching room account:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to fetch room account',
                error: error.message 
            },
            { status: 500 }
        );
    }
}
