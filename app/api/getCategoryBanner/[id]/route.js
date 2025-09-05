
import connectDB from "@/lib/connectDB";
import FoodCategory from "@/models/FoodCategory";
import FoodInventory from "@/models/FoodInventory";
import { NextResponse } from "next/server";

export const GET = async (req, { params }) => {
    await connectDB();
    const { id } = await params;

    try {
        // Find the category by slug
        const category = await FoodCategory.findOne({ slug: id }).lean();

        if (!category) {
            return NextResponse.json({ message: "Category not found" }, { status: 404 });
        }

        // Get all food items for this category with all fields
        const foodItems = await FoodInventory.find({ _id: { $in: category.foodInventoryIds } }).lean();

        // Transform the data to include all fields
        const result = {
            ...category,
            products: foodItems.map(item => ({
                ...item,  // Spread all fields from the document
                // Add any additional transformations or computed fields
                title: item.foodName,
                price: item.fullPrice || item.halfPrice || item.quarterPrice || item.perPiecePrice,
                image: item.image?.url ? {
                    url: item.image.url,
                    key: item.image.key
                } : null,
                description: item.productDescription,
                name: item.foodName
            }))
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in getCategoryBanner:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to fetch category data' },
            { status: 500 }
        );
    }
};