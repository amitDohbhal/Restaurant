import connectDB from "@/lib/connectDB";
import { NextResponse } from "next/server";
import MenuBar from "@/models/MenuBar";
import Product from "@/models/Product";

export async function GET(req, { params }) {
    await connectDB();
    const { id } = await params;
    // console.log(id)

    try {

        const menu = await MenuBar.findOne({ "subMenu._id": id })
            .populate({ path: "subMenu.products", strictPopulate: false })
            .lean();

        if (!menu) {
            return NextResponse.json({ message: "SubMenu not found" }, { status: 404 });
        }


        const subMenu = menu.subMenu.find((sub) => sub._id.toString() === id);

        if (!subMenu) {
            return NextResponse.json({ message: "SubMenu not found inside menu" }, { status: 404 });
        }

        // Manually populate products array
        const mongoose = (await import('mongoose')).default;
        const Product = mongoose.model('Product');
        const productDocs = await Product.find({ _id: { $in: subMenu.products || [] } })
            .populate('description')
            .populate('quantity')
            .populate('coupons');
        const populatedSubMenu = { ...subMenu, products: productDocs };

        return NextResponse.json(populatedSubMenu);
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
