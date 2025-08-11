
import connectDB from "@/lib/connectDB";
import MenuBar from "@/models/MenuBar";
import mongoose from 'mongoose';
import Product from '@/models/Product';
import { NextResponse } from "next/server";

export const GET = async (req, { params }) => {
    await connectDB();
    const { id } = await params;

    try {
        // Use lean() for a mutable plain JS object
        const category = await MenuBar.findOne(
            { "subMenu.url": id },
            { "subMenu.$": 1 }
        ).lean();

        if (!category) {
            return NextResponse.json({ message: "Category not found" }, { status: 404 });
        }

        const submenu = category.subMenu[0];
        // console.log('Before population:', submenu.products);

        if (submenu.products && submenu.products.length > 0) {
            // Convert all IDs to ObjectId if needed
            const productIds = submenu.products.map(id =>
                typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
            );
            // Populate the 'gallery' field for each product
            const productDocs = await Product.find({ _id: { $in: productIds } })
                .populate({ path: 'gallery' })
                .populate('quantity')
                .populate('coupons')
                .lean();
            submenu.products = productDocs;
            // console.log('After population:', submenu.products);
        }

        return NextResponse.json(submenu);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
};