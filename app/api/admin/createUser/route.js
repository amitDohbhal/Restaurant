import { getServerSession } from "next-auth";
import connectDB from "@/lib/connectDB";
import { authOptions } from "../../auth/[...nextauth]/route";
import SubAdmin from "@/models/SubAdmin";


export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return new Response(JSON.stringify({ message: "Unauthorized access!" }), { status: 403 });
        }

        const body = await req.json();

        if (!body.email || !body.password || !body.phoneNumber || !body.fullName) {
            return new Response(JSON.stringify({ message: "All fields are required!" }), { status: 400 });
        }

        await connectDB();

        const admin = await SubAdmin.findOne({ email: body.email });

        if (admin) {
            return new Response(JSON.stringify({ message: "SubAdmin with this email already exists!" }), { status: 409 });
        }

        const createAdmin = new SubAdmin({
            fullName: body.fullName,
            phoneNumber: body.phoneNumber,
            email: body.email,
            password: body.password,
            isAdmin: true,
            isSubAdmin: true
        });

        createAdmin.save()

        return new Response(JSON.stringify({ message: "SubAdmin created successfully!" }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ message: "Server error!" }), { status: 500 });
    }
}

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return new Response(JSON.stringify({ message: "Unauthorized access!" }), { status: 403 });
        }

        await connectDB();

        const admins = await SubAdmin.find({});

        return new Response(JSON.stringify({ admins }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ message: "Server error!" }), { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return new Response(JSON.stringify({ message: "Unauthorized access!" }), { status: 403 });
        }

        const { id } = await req.json();

        await connectDB();

        await SubAdmin.findByIdAndDelete(id);

        return new Response(JSON.stringify({ message: "SubAdmin deleted successfully!" }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ message: "Server error!" }), { status: 500 });
    }
}


export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return new Response(JSON.stringify({ message: "Unauthorized access!" }), { status: 403 });
        }

        const body = await req.json();

        if (!body.email || !body.password || !body.phoneNumber || !body.fullName) {
            return new Response(JSON.stringify({ message: "All fields are required!" }), { status: 400 });
        }

        await connectDB();

        const admin = await SubAdmin.findOne({ email: body.email });

        if (!admin) {
            return new Response(JSON.stringify({ message: "SubAdmin not found!" }), { status: 404 });
        }

        admin.fullName = body.fullName;
        admin.phoneNumber = body.phoneNumber;
        admin.email = body.email;
        admin.password = body.password;

        await admin.save();

        return new Response(JSON.stringify({ message: "SubAdmin updated successfully!" }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ message: "Server error!" }), { status: 500 });
    }
}