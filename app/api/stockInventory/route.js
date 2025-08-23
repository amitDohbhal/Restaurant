import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import StockInventory from "@/models/StockInventory";
import StockProduct from "@/models/StockProduct";

// Create new inventory item
// POST /api/stockInventory
export async function POST(req) {
    await connectDB();
    try {
        const body = await req.json();
        const item = await StockInventory.create(body);

        // Update StockProduct openingStock
        if (body.productName && typeof body.finalStockQty !== 'undefined') {
            await StockProduct.updateOne(
                { productName: body.productName },
                { $set: { openingStock: body.finalStockQty } }
            );
        }

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Error creating inventory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update inventory item
// PATCH /api/stockInventory/:id
export async function PATCH(req) {
    await connectDB();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const body = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }
        const updated = await StockInventory.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error('Error updating inventory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get all inventory items
// GET /api/stockInventory
export async function GET(req) {
    await connectDB();
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const sortField = searchParams.get('sort') || 'createdAt';
        const sortOrder = parseInt(searchParams.get('order') || '-1');

        const query = {};
        if (category) query.category = category;
        if (search) {
            query.productName = { $regex: search, $options: 'i' };
        }

        const sort = { [sortField]: sortOrder };
        const items = await StockInventory.find(query).sort(sort);
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
// DELETE /api/stockInventory
export async function DELETE(req) {
    await connectDB();
    try {
        const { id } = await req.json();

        // Find the item first
        const item = await StockInventory.findById(id);
        if (!item) {
            return NextResponse.json(
                { error: "Inventory item not found" }, 
                { status: 404 }
            );
        }

        // Delete the item from database
        await StockInventory.findByIdAndDelete(id);
        
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
