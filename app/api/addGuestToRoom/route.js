import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from '@/models/RoomAccount';
import RoomInfo from '@/models/RoomInfo';

export async function POST(request) {
    try {
        // Connect to the database
        await connectDB();

        // Parse the request body
        const body = await request.json();
        const {
            name,
            email,
            phone,
            roomNumber,
            checkIn,
            checkOut
        } = body;

        // Basic validation
        if (!name || !roomNumber || !checkIn || !checkOut) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if room exists and is available
        const room = await RoomInfo.findOne({ RoomNo: roomNumber, active: true });
        if (!room) {
            return NextResponse.json(
                { success: false, message: 'Room not found or inactive' },
                { status: 404 }
            );
        }

        if (room.isBooked) {
            return NextResponse.json(
                { success: false, message: `Room ${roomNumber} is already booked` },
                { status: 400 }
            );
        }

        // Check if there's a booking conflict
        const existingBooking = await RoomAccount.findOne({
            roomNumber,
            status: { $in: ['checked-in', 'reserved'] },
            $or: [
                { 
                    checkIn: { $lte: new Date(checkOut) },
                    checkOut: { $gte: new Date(checkIn) }
                }
            ]
        });

        if (existingBooking) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: `Room ${roomNumber} has a booking conflict for the selected dates` 
                },
                { status: 400 }
            );
        }
        // Start a session for transaction
        const session = await RoomAccount.startSession();
        session.startTransaction();

        try {
            // Create new room account
            const newGuest = new RoomAccount({
                name,
                email,
                phone,
                roomNumber,
                roomId: room._id,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                status: 'checked-in'
            });

            // Update room's isBooked status
            await RoomInfo.findByIdAndUpdate(
                room._id,
                { isBooked: true },
                { session }
            );

            // Save the new guest within the session
            await newGuest.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            return NextResponse.json(
                {
                    success: true,
                    message: 'Guest added to room successfully',
                    data: newGuest
                },
                { status: 201 }
            );
        } catch (error) {
            // If an error occurred, abort the transaction
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            
            console.error('Error adding guest to room:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to add guest to room',
                    error: error.message
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error adding guest to room:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to add guest to room',
                error: error.message
            },
            { status: 500 }
        );
    }
}

