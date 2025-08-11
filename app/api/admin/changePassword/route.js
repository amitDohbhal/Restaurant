import { hash, compare } from "bcryptjs";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/connectDB";
import { authOptions } from "../../auth/[...nextauth]/route";
import Admin from "@/models/Admin";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.isAdmin) {
            return new Response(JSON.stringify({ message: "Unauthorized access!" }), { status: 403 });
        }

        const { email, currentPassword, newPassword } = await req.json();

        if (!email || !currentPassword || !newPassword) {
            return new Response(JSON.stringify({ message: "All fields are required!" }), { status: 400 });
        }

        await connectDB();

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return new Response(JSON.stringify({ message: "Admin not found!" }), { status: 404 });
        }

        if (!admin.isAdmin) {
            return new Response(JSON.stringify({ message: "Unauthorized action!" }), { status: 403 });
        }

        const isMatch = await compare(currentPassword, admin.password);

        if (!isMatch) {
            return new Response(JSON.stringify({ message: "Incorrect current password!" }), { status: 401 });
        }

        // const hashedPassword = await hash(newPassword, 10);

        admin.password = newPassword;
        await admin.save();

        return new Response(JSON.stringify({ message: "Admin password updated successfully!" }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ message: "Server error!" }), { status: 500 });
    }
}
