import { NextResponse } from 'next/server';
import connectDB from "@/lib/connectDB";
import RoomAccount from '@/models/RoomAccount';
import RoomInfo from '@/models/RoomInfo';

export async function GET(request) {
  try {
    await connectDB();
    
    // Handle search query
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    
    let query = {};
    
    if (searchTerm) {
      // Check if search term is an email
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchTerm);
      
      if (isEmail) {
        // If it's an email, search by exact email match (case insensitive)
        query = { email: { $regex: `^${searchTerm}$`, $options: 'i' } };
      } else {
        // Otherwise search by name, room number, or phone
        query = {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { roomNumber: searchTerm },
            { phone: { $regex: searchTerm } }
          ]
        };
      }
      
      console.log('Search query:', JSON.stringify(query, null, 2));
    }
    
    const guests = await RoomAccount.find(query).sort({ checkIn: 1 });
    return NextResponse.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { id, status, roomId } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Guest ID is required' },
        { status: 400 }
      );
    }
    
    
    if (status === 'checked-out') {
      const session = await RoomAccount.startSession();
      session.startTransaction();
      
      try {
        // Update guest status
        const updatedGuest = await RoomAccount.findByIdAndUpdate(
          id,
          { 
            status: 'checked-out',
            actualCheckOut: new Date()
          },
          { new: true, session }
        );
        
        if (!updatedGuest) {
          throw new Error('Guest not found');
        }
        
        // Update room status
        await RoomInfo.findByIdAndUpdate(
          roomId,
          { isBooked: false },
          { session }
        );
        
        await session.commitTransaction();
        session.endSession();
        
        return NextResponse.json({
          success: true,
          message: 'Guest checked out successfully',
          data: updatedGuest
        });
        
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }
    
    // For other status updates
    const updatedGuest = await RoomAccount.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );
    
    if (!updatedGuest) {
      return NextResponse.json(
        { success: false, message: 'Guest not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Guest updated successfully',
      data: updatedGuest
    });
    
  } catch (error) {
    console.error('Error updating guest:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update guest' },
      { status: 500 }
    );
  }
}
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
            roomType,
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
                roomType,
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

