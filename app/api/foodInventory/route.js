import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import FoodInventory from "@/models/FoodInventory";
import { deleteFileFromCloudinary } from "@/utils/cloudinary";

// Get all inventory items
// GET /api/foodInventory
// Query params: 
// - category: filter by category
// - status: filter by status
// - search: search by itemName
// - sort: field to sort by (default: lastUpdated)
// - order: sort order (1 or -1, default: -1 for descending)

// Create new inventory item
// POST /api/foodInventory
export async function POST(req) {
    await connectDB();
    try {
        const body = await req.json();
        // Enforce mutually exclusive CGST
        if (body.cgstPercent && body.cgstAmount) {
            return NextResponse.json({ error: 'Only one of cgstPercent or cgstAmount should be provided.' }, { status: 400 });
        }
        // Enforce mutually exclusive SGST
        if (body.sgstPercent && body.sgstAmount) {
            return NextResponse.json({ error: 'Only one of sgstPercent or sgstAmount should be provided.' }, { status: 400 });
        }
        // Optionally, you can also enforce that at least one is present for each
        // if (!body.cgstPercent && !body.cgstAmount) ...
        // if (!body.sgstPercent && !body.sgstAmount) ...
        const item = await FoodInventory.create(body);
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Error creating inventory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update inventory item
// PATCH /api/foodInventory/:id
export async function PATCH(req) {
    await connectDB();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const body = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }
        // Enforce mutually exclusive CGST
        if (body.cgstPercent && body.cgstAmount) {
            return NextResponse.json({ error: 'Only one of cgstPercent or cgstAmount should be provided.' }, { status: 400 });
        }
        // Enforce mutually exclusive SGST
        if (body.sgstPercent && body.sgstAmount) {
            return NextResponse.json({ error: 'Only one of sgstPercent or sgstAmount should be provided.' }, { status: 400 });
        }
        const updated = await FoodInventory.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error('Error updating inventory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get all inventory items
// GET /api/foodInventory
export async function GET(req) {
    await connectDB();
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const sortField = searchParams.get('sort') || 'lastUpdated';
        const sortOrder = parseInt(searchParams.get('order') || '-1');

        const query = {};
        if (category) query.category = category;
        if (status) query.status = status;
        if (search) {
            query.itemName = { $regex: search, $options: 'i' };
        }

        const sort = { [sortField]: sortOrder };
        const items = await FoodInventory.find(query).sort(sort);
        return NextResponse.json(items, { status: 200 });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json(
            { error: "Failed to fetch inventory items" }, 
            { status: 500 }
        );
    }
}


// Delete an inventory item
// DELETE /api/foodInventory
export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the item first
        const item = await FoodInventory.findById(id);
        if (!item) {
            return NextResponse.json(
                { error: "Inventory item not found" }, 
                { status: 404 }
            );
        }

        // Delete associated image from Cloudinary if it exists
        if (item.image?.key) {
            try {
                await deleteFileFromCloudinary(item.image.key);
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error);
                // Continue with deletion even if image deletion fails
            }
        }

        // Delete the item from database
        await FoodInventory.findByIdAndDelete(id);
        
        return NextResponse.json(
            { message: "Inventory item deleted successfully" }, 
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return NextResponse.json(
            { error: `Failed to delete inventory item: ${error.message}` }, 
            { status: 500 }
        );
    }
}
