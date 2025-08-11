import connectDB from "@/lib/connectDB";
import Contact from "@/models/Contact";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await connectDB();
        const data = await req.json();

        const contact = await Contact.findOne({ email: data.email });

        if (contact) {
            return NextResponse.json({ message: "You have already sent a contact request" }, { status: 400 });
        }

        const newContact = new Contact(data);
        await newContact.save();

        return NextResponse.json({ message: "Contact saved successfully", contact }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}