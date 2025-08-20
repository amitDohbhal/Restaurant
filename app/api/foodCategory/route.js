// food category
import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import FoodCategory from "@/models/FoodCategory";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";


export async function GET() {
    await connectDB();
    try {
        const categories = await FoodCategory.find().sort({ order: 1 });
        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const { categoryName, categoryType, image } = await req.json();

        // Find the highest order number
        const lastCategory = await FoodCategory.findOne().sort({ order: -1 });
        const nextOrder = lastCategory ? lastCategory.order + 1 : 1;

        const newCategory = new FoodCategory({ categoryName, categoryType, order: nextOrder, image });
        await newCategory.save();
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create category: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const { id, categoryName, categoryType, image, order } = await req.json();
        const updatedCategory = await FoodCategory.findByIdAndUpdate(id, { categoryName, categoryType, image, order }, { new: true });
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
        const category = await FoodCategory.findById(id);
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Delete the image from Uploadthing/Cloudinary (if key exists)
        if (category.image?.key) {
            await deleteFileFromCloudinary(category.image.key);
        }

        // Delete category from database
        await FoodCategory.findByIdAndDelete(id);

        return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete category: ${error.message}` }, { status: 500 });
    }
}
