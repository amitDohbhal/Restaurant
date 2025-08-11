import connectDB from "@/lib/connectDB";
import MenuBar from "@/models/MenuBar";
import Package from "@/models/Package";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        await connectDB();
        const { id } = await (params);
        if (!id) {
            return NextResponse.json({ message: "Invalid request, ID is required" }, { status: 400 });
        }
        const menu = await MenuBar.findOne({ "subMenu.url": id }).populate("subMenu.packages");

        if (!menu) {
            return NextResponse.json({ message: "Packages not found" }, { status: 404 });
        }

        // Extract the specific submenu that matches the requested `id`
        const subMenu = menu.subMenu.find(sub => sub.url === id);

        if (!subMenu) {
            return NextResponse.json({ message: "Submenu not found" }, { status: 404 });
        }

        return NextResponse.json({ packages: subMenu.packages }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}