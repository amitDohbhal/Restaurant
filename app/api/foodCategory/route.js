// food category
import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import FoodCategory from "@/models/FoodCategory";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";
import FoodInventory from "@/models/FoodInventory";
export async function GET() {
    await connectDB();
    try {
        const categories = await FoodCategory.find()
        .populate({
            path: 'foodInventoryIds',
        })
        .sort({ order: 1 });
        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(req) {
    await connectDB();
    try {
        const { categoryName,categoryProfileImage,categoryBannerImage,slug } = await req.json();

        // Find the highest order number
        const lastCategory = await FoodCategory.findOne().sort({ order: -1 });
        const nextOrder = lastCategory ? lastCategory.order + 1 : 1;

        const newCategory = new FoodCategory({ categoryName,categoryProfileImage,categoryBannerImage,slug, order: nextOrder });
        await newCategory.save();
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: `Failed to create category: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req) {
    await connectDB();
    try {
        const { id, categoryName,categoryProfileImage,categoryBannerImage,slug, order } = await req.json();
        const updatedCategory = await FoodCategory.findByIdAndUpdate(id, { categoryName,categoryProfileImage,categoryBannerImage,slug, order }, { new: true });
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
        // Delete images from Cloudinary if they exist
        const deletePromises = [];
        
        // Delete profile image if it exists
        if (category.categoryProfileImage?.key) {
            deletePromises.push(
                deleteFileFromCloudinary(category.categoryProfileImage.key)
                .catch(err => console.error('Error deleting profile image:', err))
            );
        }
        
        // Delete banner image if it exists
        if (category.categoryBannerImage?.key) {
            deletePromises.push(
                deleteFileFromCloudinary(category.categoryBannerImage.key)
                .catch(err => console.error('Error deleting banner image:', err))
            );
        }
        
        // Wait for all image deletions to complete
        await Promise.all(deletePromises);
        
        await FoodCategory.findByIdAndDelete(id);
        return NextResponse.json({ message: "Category and associated images deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error('Error in DELETE /api/foodCategory:', error);
        return NextResponse.json({ error: `Failed to delete category: ${error.message}` }, { status: 500 });
    }
}
