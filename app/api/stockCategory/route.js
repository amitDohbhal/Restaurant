// food category
import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import StockCategory from "@/models/StockCategory";


export async function GET() {
    await connectDB();
    try {
        const categories = await StockCategory.find().sort({ order: 1 });
        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const { categoryName, quantityType } = await req.json();

        // Find the highest order number
        const lastCategory = await StockCategory.findOne().sort({ order: -1 });
        const nextOrder = lastCategory ? lastCategory.order + 1 : 1;

        const newCategory = new StockCategory({ categoryName, quantityType, order: nextOrder });
        await newCategory.save();
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create category: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const { id, categoryName, quantityType, order } = await req.json();
        const updatedCategory = await StockCategory.findByIdAndUpdate(id, { categoryName, quantityType, order }, { new: true });
        return NextResponse.json(updatedCategory, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the category first
        const category = await StockCategory.findById(id);
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Delete category from database
        await StockCategory.findByIdAndDelete(id);

        return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete category: ${error.message}` }, { status: 500 });
    }
}
