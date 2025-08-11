import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Admin from '@/models/Admin';

export async function POST(req) {
    try {
        const body = await req.json();

        if (!body.email || !body.password) {
            return NextResponse.json(
                { message: "All fields are required!" }, 
                { status: 400 }
            );
        }

        await connectDB();

        // Check if there are any existing main admins
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return NextResponse.json(
                { message: "Main admin already exists!" }, 
                { status: 400 }
            );
        }

        // Check if email is already in use
        const existingAdmin = await Admin.findOne({ email: body.email });
        if (existingAdmin) {
            return NextResponse.json(
                { message: "Admin with this email already exists!" }, 
                { status: 400 }
            );
        }

        // Create the main admin
        const createAdmin = new Admin({
            email: body.email,
            password: body.password
        });

        await createAdmin.save();

        return NextResponse.json(
            { message: "First admin created successfully!" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error in setup first admin:", error);
        return NextResponse.json(
            { message: "Server error!" },
            { status: 500 }
        );
    }
}
