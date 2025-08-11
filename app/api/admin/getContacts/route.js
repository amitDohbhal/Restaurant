import connectDB from "@/lib/connectDB";
import Contact from "@/models/Contact";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ message: "Unauthorized access!" }, { status: 403 });
        }

        await connectDB();

        const contacts = await Contact.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ contacts }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ message: "Unauthorized access!" }, { status: 403 });
        }

        const { id } = await req.json();

        await connectDB();

        await Contact.findByIdAndDelete(id);

        return NextResponse.json({ message: "Contact deleted successfully!" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}