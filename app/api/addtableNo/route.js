import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import TableNo from '@/models/TableNo';

// Get all tables
// GET /api/addtableNo
export async function GET() {
  try {
    await connectDB();
    const tables = await TableNo.find();
    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

// Add a new table
// POST /api/addtableNo
export async function POST(req) {
  try {
    await connectDB();
    const { tableNumber } = await req.json();

    // Validate input
    if (!tableNumber) {
      return NextResponse.json(
        { success: false, error: 'Table number is required' },
        { status: 400 }
      );
    }

    // Check if table number already exists
    const existingTable = await TableNo.findOne({ tableNumber });
    if (existingTable) {
      return NextResponse.json(
        { success: false, error: 'Table number already exists' },
        { status: 400 }
      );
    }

    // Create new table
    const newTable = new TableNo({
      tableNumber,
    });

    await newTable.save();

    return NextResponse.json({
      success: true,
      message: 'Table added successfully',
      table: newTable
    });
  } catch (error) {
    console.error('Error adding table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add table' },
      { status: 500 }
    );
  }
}